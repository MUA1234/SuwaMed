import { Router, Request, Response, NextFunction } from 'express';
import SlmcRegistry from '../models/SlmcRegistry.model';
import { AppError } from '../utils/errorResponse';

const router = Router();

// GET /api/slmc/verify/:slmcNo — public, no auth needed
router.get('/verify/:slmcNo', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const slmcNo = req.params.slmcNo as string;

    const record = await SlmcRegistry.findOne({ slmcNo: slmcNo.toUpperCase() });

    if (!record) {
      throw new AppError('Invalid SLMC registration number', 404);
    }

    if (record.isUsed) {
      throw new AppError('This SLMC number is already registered', 409);
    }

    res.status(200).json({
      success: true,
      message: 'SLMC number verified successfully',
      data: {
        slmcNo: record.slmcNo,
        firstName: record.firstName,
        lastName: record.lastName,
        specialization: record.specialization,
        qualifications: record.qualifications,
        experience: record.experience,
        hospital: record.hospital,
        consultationFee: record.consultationFee,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
