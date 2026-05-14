import { Router } from 'express';
import { protect } from '../middleware/auth.middleware';
import { symptomLimiter } from '../middleware/rateLimiter.middleware';
import {
  checkSymptoms,
  getHistory,
  getResult,
  deleteCheck,
} from '../controllers/symptom.controller';

const router = Router();

router.use(protect);
// Only /check is gated — reading history is free. Order matters: `protect`
// already ran above, so the limiter's keyGenerator has access to req.user.id.
router.post('/check', symptomLimiter, checkSymptoms);
router.get('/history', getHistory);
router.get('/:id', getResult);
router.delete('/:id', deleteCheck);

export default router;
