import { Router } from 'express';
import { protect } from '../middleware/auth.middleware';
import { createReview, getMyReviews } from '../controllers/review.controller';

const router = Router();

router.post('/', protect, createReview);
router.get('/my', protect, getMyReviews);

export default router;
