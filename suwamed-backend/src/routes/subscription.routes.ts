import { Router } from 'express';
import { protect } from '../middleware/auth.middleware';
import { AppError } from '../utils/errorResponse';

const router = Router();

// All subscription routes require authentication
router.use(protect);

// GET /api/subscriptions — get user's subscription status
router.get('/', async (req, res, _next) => {
  const userId = (req as any).user.id;
  res.status(200).json({
    success: true,
    data: {
      userId,
      plan: 'free',
      status: 'active',
      features: {
        maxAppointmentsPerMonth: 5,
        symptomCheckEnabled: true,
        videoConsultation: true,
      },
    },
  });
});

// POST /api/subscriptions — create/upgrade subscription
router.post('/', (_req, _res, next) => {
  next(new AppError('Subscription upgrades are not yet available', 501));
});

export default router;
