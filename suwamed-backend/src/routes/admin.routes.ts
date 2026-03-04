import { Router } from 'express';
import { protect } from '../middleware/auth.middleware';
import {
  getDashboard,
  getUsers,
  getUserById,
  updateUserStatus,
  getPendingDoctors,
  verifyDoctor,
  rejectDoctor,
  getRevenue,
  getAppointmentAnalytics,
} from '../controllers/admin.controller';

const router = Router();

router.use(protect);
router.get('/dashboard', getDashboard);
router.get('/users', getUsers);
router.get('/users/:id', getUserById);
router.put('/users/:id/status', updateUserStatus);
router.get('/doctors/pending', getPendingDoctors);
router.put('/doctors/:id/verify', verifyDoctor);
router.put('/doctors/:id/reject', rejectDoctor);
router.get('/revenue', getRevenue);
router.get('/appointment-analytics', getAppointmentAnalytics);

export default router;
