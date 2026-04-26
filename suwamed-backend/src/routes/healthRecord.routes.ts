import { Router } from 'express';
import { protect } from '../middleware/auth.middleware';
import { uploadSingle } from '../middleware/upload.middleware';
import { getRecords, createRecord, getRecordById } from '../controllers/healthRecord.controller';

const router = Router();

router.get('/', protect, getRecords);
// Accept either JSON or multipart with a `file` field. Multer is no-op for JSON.
router.post('/', protect, uploadSingle('file'), createRecord);
router.get('/:id', protect, getRecordById);

export default router;
