import { Router } from 'express';
import { protect } from '../middleware/auth.middleware';
import {
  checkSymptoms,
  getHistory,
  getResult,
  deleteCheck,
} from '../controllers/symptom.controller';

const router = Router();

router.use(protect);
router.post('/check', checkSymptoms);
router.get('/history', getHistory);
router.get('/:id', getResult);
router.delete('/:id', deleteCheck);

export default router;
