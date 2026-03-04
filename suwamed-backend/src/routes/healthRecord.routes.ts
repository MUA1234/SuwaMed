import { Router } from 'express';
import { protect } from '../middleware/auth.middleware';
import { getRecords, createRecord, getRecordById } from '../controllers/healthRecord.controller';

const router = Router();

router.get('/', protect, getRecords);
router.post('/', protect, createRecord);
router.get('/:id', protect, getRecordById);

export default router;
