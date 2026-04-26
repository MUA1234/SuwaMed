import { Request, Response, NextFunction } from 'express';
import Payment from '../models/Payment.model';
import Doctor from '../models/Doctor.model';
import { AppError } from '../utils/errorResponse';

// GET /api/payments/history — payment history for logged-in user
export const getHistory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userId = (req as any).user.id;
        const payments = await Payment.find({ userId })
            .sort({ createdAt: -1 })
            .populate({
                path: 'appointmentId',
                select: 'date type status doctorId',
                populate: {
                    path: 'doctorId',
                    select: 'userId specialization',
                    populate: { path: 'userId', select: 'firstName lastName avatar' },
                },
            });
        res.status(200).json({ success: true, data: payments });
    } catch (error) {
        next(error);
    }
};

// POST /api/payments/withdraw — doctor requests a withdrawal of earnings
export const requestWithdrawal = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userId = (req as any).user.id;
        const { bankName, branchName, accountNumber, accountHolderName, amount } = req.body;

        if (!amount || isNaN(Number(amount)) || Number(amount) < 500) {
            throw new AppError('Minimum withdrawal amount is LKR 500', 400);
        }

        const doctor = await Doctor.findOne({ userId });
        if (!doctor) throw new AppError('Doctor profile not found', 404);

        if (Number(amount) > doctor.pendingWithdrawal) {
            throw new AppError('Amount exceeds available balance', 400);
        }

        // Deduct from pending withdrawal balance
        await Doctor.findByIdAndUpdate(doctor._id, {
            $inc: { pendingWithdrawal: -Number(amount) },
        });

        res.status(200).json({
            success: true,
            message: 'Withdrawal request submitted successfully. Processing within 2-3 business days.',
            data: {
                amount: Number(amount),
                bankName,
                branchName,
                accountNumber,
                accountHolderName,
                status: 'pending',
                requestedAt: new Date(),
            },
        });
    } catch (error) {
        next(error);
    }
};
