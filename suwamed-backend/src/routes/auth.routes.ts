import { Router } from 'express';
import {
  register,
  login,
  verifyOTP,
  resendOTP,
  forgotPassword,
  resetPassword,
  refreshToken,
  logout,
  getMe,
  changePassword,
  deleteAccount,
} from '../controllers/auth.controller';
import { protect } from '../middleware/auth.middleware';
import { authLimiter } from '../middleware/rateLimiter.middleware';

const router = Router();

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.post('/verify-otp', verifyOTP);
router.post('/resend-otp', authLimiter, resendOTP);
router.post('/forgot-password', authLimiter, forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/refresh-token', refreshToken);
router.post('/logout', protect, logout);
router.get('/me', protect, getMe);
router.put('/change-password', protect, changePassword);
router.delete('/account', protect, deleteAccount);

export default router;
