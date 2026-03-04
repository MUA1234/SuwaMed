import { Router } from 'express';
import { protect } from '../middleware/auth.middleware';
import { getProfile, updateProfile, updateUser } from '../controllers/patient.controller';

const router = Router();

router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);
router.put('/user', protect, updateUser);

export default router;
