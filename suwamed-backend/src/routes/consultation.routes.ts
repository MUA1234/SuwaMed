import { Router } from 'express';
import { protect } from '../middleware/auth.middleware';
import Appointment from '../models/Appointment.model';
import Doctor from '../models/Doctor.model';

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

export default router;
