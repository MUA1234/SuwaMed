import { Router } from 'express';
import { protect } from '../middleware/auth.middleware';
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
  setAvailability,
  getDoctorAvailability,
} from '../controllers/doctor.controller';

const router = Router();

// Public
router.get('/', getDoctors);
router.get('/search', getDoctors);

// Protected — must be before /:id routes
router.get('/profile', protect, getDoctorProfile);
router.put('/profile', protect, updateDoctorProfile);
router.get('/dashboard', protect, getDashboardStats);
router.get('/patients', protect, getPatients);
router.get('/patients/:id', protect, getPatientDetail);
router.get('/patients/:id/health-records', protect, getPatientHealthRecords);
router.get('/earnings', protect, getEarnings);
router.put('/availability', protect, setAvailability);

// Parameterized (public)
router.get('/:id', getDoctorById);
router.get('/:id/availability', getDoctorAvailability);
router.get('/:id/reviews', getDoctorReviews);

export default router;
