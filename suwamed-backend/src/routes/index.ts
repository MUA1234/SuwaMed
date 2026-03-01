import { Router } from 'express';
import authRoutes from './auth.routes';
import patientRoutes from './patient.routes';
import doctorRoutes from './doctor.routes';
import appointmentRoutes from './appointment.routes';
import healthRecordRoutes from './healthRecord.routes';
import prescriptionRoutes from './prescription.routes';
import symptomRoutes from './symptom.routes';
import paymentRoutes from './payment.routes';
import subscriptionRoutes from './subscription.routes';
import reviewRoutes from './review.routes';
import notificationRoutes from './notification.routes';
import healthTipRoutes from './healthTip.routes';
import adminRoutes from './admin.routes';
import consultationRoutes from './consultation.routes';
import chatRoutes from './chat.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/patients', patientRoutes);
router.use('/doctors', doctorRoutes);
router.use('/appointments', appointmentRoutes);
router.use('/health-records', healthRecordRoutes);
router.use('/prescriptions', prescriptionRoutes);
router.use('/symptoms', symptomRoutes);
router.use('/payments', paymentRoutes);
router.use('/subscriptions', subscriptionRoutes);
router.use('/reviews', reviewRoutes);
router.use('/notifications', notificationRoutes);
router.use('/health-tips', healthTipRoutes);
router.use('/admin', adminRoutes);
router.use('/consultations', consultationRoutes);
router.use('/chat', chatRoutes);

export default router;
