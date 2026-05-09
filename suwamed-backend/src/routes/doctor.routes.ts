import { Router } from 'express';
import { protect } from '../middleware/auth.middleware';
import { uploadSingle, uploadMultiple } from '../middleware/upload.middleware';
import {
  getDoctors,
  getDoctorById,
  getDoctorProfile,
  getDashboardStats,
  getPatients,
  getPatientDetail,
  getPatientHealthRecords,
  getDoctorReviews,
  getEarnings,
  updateDoctorProfile,
  uploadDoctorAvatar,
  uploadDoctorVerificationDocuments,
  setAvailability,
  getDoctorAvailability,
  getBlockedSlots,
  addBlockedSlot,
  removeBlockedSlot,
} from '../controllers/doctor.controller';

const router = Router();

// Public
router.get('/', getDoctors);
router.get('/search', getDoctors);

// Protected — must be before /:id routes
router.get('/profile', protect, getDoctorProfile);
router.put('/profile', protect, updateDoctorProfile);
router.post('/profile/avatar', protect, uploadSingle('avatar'), uploadDoctorAvatar);
router.post('/verification-documents', protect, uploadMultiple('documents', 5), uploadDoctorVerificationDocuments);
router.get('/dashboard', protect, getDashboardStats);
router.get('/patients', protect, getPatients);
router.get('/patients/:id', protect, getPatientDetail);
router.get('/patients/:id/health-records', protect, getPatientHealthRecords);
router.get('/earnings', protect, getEarnings);
router.put('/availability', protect, setAvailability);
router.get('/blocked-slots', protect, getBlockedSlots);
router.post('/blocked-slots', protect, addBlockedSlot);
router.delete('/blocked-slots/:index', protect, removeBlockedSlot);

// Parameterized (public)
router.get('/:id', getDoctorById);
router.get('/:id/availability', getDoctorAvailability);
router.get('/:id/reviews', getDoctorReviews);

export default router;
