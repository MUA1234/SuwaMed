import { Request, Response, NextFunction } from 'express';
import Patient from '../models/Patient.model';
import SubscriptionPlan from '../models/Subscription.model';
import { AppError } from '../utils/errorResponse';
import { sendToUser } from '../services/notification.service';

// Plan tiers are stored in the SubscriptionPlan collection (admin-managed) so
// pricing and feature limits can change without a deploy. To bootstrap fresh
// installs we ship a deterministic in-memory fallback when the collection is
// empty.
const FALLBACK_PLANS = [
  {
    name: 'free',
    price: 0,
    duration: 30,
    maxConsultationsPerMonth: 3,
    maxSymptomChecksPerDay: 3,
    videoCallEnabled: false,
    priorityBooking: false,
    features: [{ name: 'Basic symptom checker' }, { name: 'Standard booking' }],
  },
  {
    name: 'basic',
    price: 499,
    duration: 30,
    maxConsultationsPerMonth: 10,
    maxSymptomChecksPerDay: 20,
    videoCallEnabled: true,
    priorityBooking: false,
    features: [{ name: 'AI symptom checker' }, { name: 'Video consultations' }, { name: 'Priority support' }],
  },
  {
    name: 'premium',
    price: 999,
    duration: 30,
    maxConsultationsPerMonth: 9999,
    maxSymptomChecksPerDay: 9999,
    videoCallEnabled: true,
    priorityBooking: true,
    features: [
      { name: 'Unlimited consultations' },
      { name: 'Priority booking' },
      { name: 'Health record cloud sync' },
      { name: '24/7 chat with doctors' },
    ],
  },
];

const ALLOWED_PLANS = ['free', 'basic', 'premium'] as const;
type PlanKey = (typeof ALLOWED_PLANS)[number];

// GET /api/subscriptions/plans — public-ish list of plan tiers.
export const listPlans = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const dbPlans = await SubscriptionPlan.find({ isActive: true }).lean();
    res.status(200).json({ success: true, data: dbPlans.length > 0 ? dbPlans : FALLBACK_PLANS });
  } catch (err) {
    next(err);
  }
};

// GET /api/subscriptions — current user's plan + limits.
export const getMySubscription = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const patient = await Patient.findOne({ userId }).lean();
    const planName = (patient?.subscription?.plan as PlanKey | undefined) || 'free';
    const planDef =
      (await SubscriptionPlan.findOne({ name: planName, isActive: true }).lean()) ||
      FALLBACK_PLANS.find((p) => p.name === planName) ||
      FALLBACK_PLANS[0];
    res.status(200).json({
      success: true,
      data: {
        plan: planName,
        startDate: patient?.subscription?.startDate ?? null,
        endDate: patient?.subscription?.endDate ?? null,
        isActive: patient?.subscription?.isActive ?? true,
        autoRenew: patient?.subscription?.autoRenew ?? false,
        features: planDef,
      },
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/subscriptions — upgrade/downgrade. Body: { plan: 'free'|'basic'|'premium' }
// Payment is **not** charged here — that comes through the payment controller
// and a successful webhook (or cash flow) should call this internally. For now
// we activate immediately; when PayHere is wired this becomes a payment-first
// flow with a pending state.
export const upgradeSubscription = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const { plan } = req.body as { plan?: string };
    if (!plan || !ALLOWED_PLANS.includes(plan as PlanKey)) {
      throw new AppError('plan must be one of: free, basic, premium', 400);
    }
    const planDef =
      (await SubscriptionPlan.findOne({ name: plan, isActive: true }).lean()) ||
      FALLBACK_PLANS.find((p) => p.name === plan);
    if (!planDef) throw new AppError('Plan not available', 400);

    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + (planDef.duration || 30));

    const patient = await Patient.findOneAndUpdate(
      { userId },
      {
        subscription: {
          plan,
          startDate,
          endDate: plan === 'free' ? null : endDate,
          isActive: true,
          autoRenew: plan !== 'free',
        },
      },
      { new: true, upsert: true },
    ).lean();

    await sendToUser({
      userId,
      type: 'subscription_renewed',
      title: 'Subscription updated',
      body: `Your subscription is now ${plan}.`,
      data: { plan },
    });

    res.status(200).json({ success: true, data: patient?.subscription });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/subscriptions — cancel auto-renew (downgrade to free at period end).
export const cancelSubscription = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const patient = await Patient.findOneAndUpdate(
      { userId },
      { 'subscription.autoRenew': false },
      { new: true },
    ).lean();
    if (!patient) throw new AppError('Subscription not found', 404);
    res.status(200).json({ success: true, data: patient.subscription });
  } catch (err) {
    next(err);
  }
};
