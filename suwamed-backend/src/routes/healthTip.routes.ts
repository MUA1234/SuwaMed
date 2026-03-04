import { Router } from 'express';
import { protect } from '../middleware/auth.middleware';
import {
    getHealthTips,
    getAllHealthTipsAdmin,
    createHealthTip,
    updateHealthTip,
    deleteHealthTip,
} from '../controllers/healthTip.controller';

const router = Router();

router.get('/', getHealthTips);
router.get('/admin/all', protect, getAllHealthTipsAdmin);
router.post('/', protect, createHealthTip);
router.put('/:id', protect, updateHealthTip);
router.delete('/:id', protect, deleteHealthTip);

export default router;
