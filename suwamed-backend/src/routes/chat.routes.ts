import { Router, Request, Response, NextFunction } from 'express';
import { protect } from '../middleware/auth.middleware';
import { AppError } from '../utils/errorResponse';
import Appointment from '../models/Appointment.model';
import Doctor from '../models/Doctor.model';
import Message from '../models/Message.model';

const router = Router();
router.use(protect);

// Same authorization predicate as the socket layer keeps the two paths in lockstep.
async function userBelongsToAppointment(
  appointmentId: string,
  user: { id: string; role: string },
): Promise<boolean> {
  const appt = await Appointment.findById(appointmentId).select('patientId doctorId').lean();
  if (!appt) return false;
  if (user.role === 'admin') return true;
  if (user.role === 'patient' && String(appt.patientId) === user.id) return true;
  if (user.role === 'doctor') {
    const doc = await Doctor.findOne({ userId: user.id }).select('_id').lean();
    if (doc && String(appt.doctorId) === String(doc._id)) return true;
  }
  return false;
}

// GET /api/chat/:appointmentId/messages — paginated history.
// `before` is an ISO timestamp cursor; results are returned oldest-first so
// the client can append them to its FlatList without re-sorting.
router.get('/:appointmentId/messages', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user as { id: string; role: string };
    const { appointmentId } = req.params;
    if (!(await userBelongsToAppointment(String(appointmentId), user))) {
      throw new AppError('Not authorised for this consultation', 403);
    }
    const limit = Math.min(Math.max(parseInt(String(req.query.limit ?? '50'), 10) || 50, 1), 100);
    const before = req.query.before ? new Date(String(req.query.before)) : null;
    const filter: Record<string, unknown> = { consultationId: appointmentId };
    if (before && !isNaN(before.getTime())) {
      filter.createdAt = { $lt: before };
    }
    const messages = await Message.find(filter).sort({ createdAt: -1 }).limit(limit).lean();
    res.status(200).json({
      success: true,
      data: messages.reverse(),
      nextBefore: messages.length === limit ? messages[0].createdAt : null,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/chat/:appointmentId — full transcript (capped at 200) for simple use.
router.get('/:appointmentId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user as { id: string; role: string };
    const { appointmentId } = req.params;
    if (!(await userBelongsToAppointment(String(appointmentId), user))) {
      throw new AppError('Not authorised for this consultation', 403);
    }
    const messages = await Message.find({ consultationId: appointmentId })
      .sort({ createdAt: 1 })
      .limit(200)
      .lean();
    res.status(200).json({ success: true, data: messages });
  } catch (err) {
    next(err);
  }
});

export default router;
