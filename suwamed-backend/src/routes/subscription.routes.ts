import { Router } from 'express';
import { protect } from '../middleware/auth.middleware';
import {
  listPlans,
  getMySubscription,
  upgradeSubscription,
  cancelSubscription,
} from '../controllers/subscription.controller';

const router = Router();

router.use(protect);
router.get('/plans', listPlans);
router.get('/', getMySubscription);
router.post('/', upgradeSubscription);
router.delete('/', cancelSubscription);

export default router;
