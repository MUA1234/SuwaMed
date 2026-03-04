import { Router } from 'express';
import { protect } from '../middleware/auth.middleware';
import {
  createPrescription,
  getPrescriptions,
  getPrescriptionById,
} from '../controllers/prescription.controller';

const router = Router();

router.use(protect);
router.get('/', getPrescriptions);
router.post('/', createPrescription);
router.get('/:id', getPrescriptionById);

export default router;
