import { Router } from 'express';
import { protect } from '../middleware/auth.middleware';
import Appointment from '../models/Appointment.model';
import Doctor from '../models/Doctor.model';
import { AppError } from '../utils/errorResponse';
import { mintAgoraToken } from '../services/agora.service';

const router = Router();

router.use(protect);

// GET /api/consultations — get consultations (alias for in_progress/completed appointments)
router.get('/', async (req, res, next) => {
  try {
    const userId = (req as any).user.id;
    const role = (req as any).user.role;

    let filter: any = {
      status: { $in: ['in_progress', 'completed'] },
    };

    if (role === 'doctor') {
      const doctor = await Doctor.findOne({ userId });
      if (doctor) filter.doctorId = doctor._id;
    } else {
      filter.patientId = userId;
    }

    const consultations = await Appointment.find(filter)
      .populate('patientId', 'firstName lastName avatar')
      .populate({
        path: 'doctorId',
        populate: { path: 'userId', select: 'firstName lastName avatar' },
      })
      .sort({ updatedAt: -1 })
      .limit(20);

    res.status(200).json({ success: true, data: consultations });
  } catch (error) {
    next(error);
  }
});

// POST /api/consultations/:appointmentId/token — mint an Agora RTC token for
// the calling user, scoped to a channel keyed on the appointment id.
router.post('/:appointmentId/token', async (req, res, next) => {
  try {
    const userId = (req as any).user.id as string;
    const role = (req as any).user.role as 'patient' | 'doctor' | 'admin';
    const { appointmentId } = req.params;

    const appt = await Appointment.findById(appointmentId).select('patientId doctorId status consultation type');
    if (!appt) throw new AppError('Appointment not found', 404);
    if (appt.type !== 'video') {
      // The "video" call button shouldn't render on chat/follow-up bookings,
      // but enforce it server-side too.
      throw new AppError('Video calls are only available for video appointments', 400);
    }
    if (!['confirmed', 'in_progress'].includes(appt.status)) {
      throw new AppError('Video call not available — appointment is not active', 400);
    }
    if (role === 'patient' && String(appt.patientId) !== userId) {
      throw new AppError('Not authorised', 403);
    }
    if (role === 'doctor') {
      const doc = await Doctor.findOne({ userId }).select('_id').lean();
      if (!doc || String(appt.doctorId) !== String(doc._id)) {
        throw new AppError('Not authorised', 403);
      }
    }

    const channelName = `appt_${String(appt._id)}`;
    // UID derived from the user id — agora-token expects a 32-bit unsigned int.
    // Take the trailing 8 hex chars of the ObjectId so two parties of the same
    // appointment get distinct UIDs without colliding across appointments.
    const uid = parseInt(String(userId).slice(-8), 16) % 2_000_000_000 || 1;
    const expiresInSec = 60 * 60; // 1 hour

    const token = mintAgoraToken({ channelName, uid, role, expiresInSec });
    if (!token) {
      throw new AppError('Agora is not configured on this server', 503);
    }

    // Persist the channel name on first mint so the appointment record carries
    // the canonical channel id for analytics/recordings.
    if (!appt.consultation?.agoraChannelName) {
      await Appointment.findByIdAndUpdate(appt._id, {
        'consultation.agoraChannelName': channelName,
      });
    }

    res.status(200).json({
      success: true,
      data: {
        appId: process.env.AGORA_APP_ID,
        channelName,
        token,
        uid,
        expiresInSec,
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
