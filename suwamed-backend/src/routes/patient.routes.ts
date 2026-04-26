import { Router } from 'express';
import { protect } from '../middleware/auth.middleware';
import { uploadSingle } from '../middleware/upload.middleware';
import { getProfile, updateProfile, updateUser, uploadAvatar } from '../controllers/patient.controller';

const router = Router();

router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);
router.put('/user', protect, updateUser);
router.post('/profile/avatar', protect, uploadSingle('avatar'), uploadAvatar);

export default router;
