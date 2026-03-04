import { Router } from 'express';
import { protect } from '../middleware/auth.middleware';
import {
  getAppointments,
  getAppointmentById,
  createAppointment,
  confirmAppointment,
  cancelAppointment,
  startConsultation,
  endConsultation,
} from '../controllers/appointment.controller';

const router = Router();

router.get('/', protect, getAppointments);
router.get('/:id', protect, getAppointmentById);
router.post('/', protect, createAppointment);
router.put('/:id/confirm', protect, confirmAppointment);
router.put('/:id/cancel', protect, cancelAppointment);
router.put('/:id/start', protect, startConsultation);
router.put('/:id/end', protect, endConsultation);

export default router;
