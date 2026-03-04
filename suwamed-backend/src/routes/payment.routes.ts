import { Router } from 'express';
import { protect } from '../middleware/auth.middleware';
import { getHistory, requestWithdrawal } from '../controllers/payment.controller';

const router = Router();

router.get('/history', protect, getHistory);
router.post('/withdraw', protect, requestWithdrawal);

export default router;
