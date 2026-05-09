import { Router } from 'express';
import { protect } from '../middleware/auth.middleware';
import {
  createReview,
  getMyReviews,
  getReviewById,
  updateReview,
  deleteReview,
} from '../controllers/review.controller';

const router = Router();

router.post('/', protect, createReview);
router.get('/my', protect, getMyReviews);
router.get('/:id', protect, getReviewById);
router.put('/:id', protect, updateReview);
router.delete('/:id', protect, deleteReview);

export default router;
