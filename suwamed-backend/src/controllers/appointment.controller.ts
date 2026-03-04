import { Request, Response, NextFunction } from 'express';
import Appointment from '../models/Appointment.model';
import Doctor from '../models/Doctor.model';
import { AppError } from '../utils/errorResponse';

// GET /api/appointments — list appointments for the logged-in user
export const getAppointments = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userId = (req as any).user.id;
        const role = (req as any).user.role;
        const { status, date } = req.query;

        let filter: any = {};

        if (role === 'doctor') {
            const doctor = await Doctor.findOne({ userId });
            if (!doctor) throw new AppError('Doctor not found', 404);
            filter.doctorId = doctor._id;
        } else {
            filter.patientId = userId;
        }

        if (status) filter.status = status;
        if (date) {
            const d = new Date(date as string);
            d.setHours(0, 0, 0, 0);
            const next = new Date(d);
            next.setDate(next.getDate() + 1);
            filter.date = { $gte: d, $lt: next };
        }

        const appointments = await Appointment.find(filter)
            .populate('patientId', 'firstName lastName email phone avatar')
            .populate({
                path: 'doctorId',
                populate: { path: 'userId', select: 'firstName lastName avatar' },
            })
            .sort({ date: -1, startTime: 1 });

        res.status(200).json({ success: true, data: appointments });
    } catch (error) {
        next(error);
    }
};

// GET /api/appointments/:id
export const getAppointmentById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const appointment = await Appointment.findById(req.params.id)
            .populate('patientId', 'firstName lastName email phone avatar')
            .populate({
                path: 'doctorId',
                populate: { path: 'userId', select: 'firstName lastName avatar email phone' },
            });
        if (!appointment) throw new AppError('Appointment not found', 404);
        res.status(200).json({ success: true, data: appointment });
    } catch (error) {
        next(error);
    }
};

// POST /api/appointments — create appointment
export const createAppointment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userId = (req as any).user.id;
        const { doctorId, date, startTime, endTime, type, reason, symptoms } = req.body;

        const doctor = await Doctor.findById(doctorId);
        if (!doctor) throw new AppError('Doctor not found', 404);

        const appointment = await Appointment.create({
            patientId: userId,
            doctorId,
            date,
            startTime,
            endTime,
            type: type || 'video',
            reason,
            symptoms: symptoms || [],
            status: 'pending',
            payment: {
                amount: doctor.consultationFee,
                status: 'pending',
            },
        });

        res.status(201).json({ success: true, data: appointment });
    } catch (error) {
        next(error);
    }
};

// PUT /api/appointments/:id/confirm
export const confirmAppointment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const appointment = await Appointment.findByIdAndUpdate(
            req.params.id,
            { status: 'confirmed', 'payment.status': 'completed', 'payment.paidAt': new Date() },
            { new: true }
        );
        if (!appointment) throw new AppError('Appointment not found', 404);
        res.status(200).json({ success: true, data: appointment });
    } catch (error) {
        next(error);
    }
};

// PUT /api/appointments/:id/cancel
export const cancelAppointment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userId = (req as any).user.id;
        const appointment = await Appointment.findByIdAndUpdate(
            req.params.id,
            { status: 'cancelled', cancelledBy: userId, cancelReason: req.body.reason },
            { new: true }
        );
        if (!appointment) throw new AppError('Appointment not found', 404);
        res.status(200).json({ success: true, data: appointment });
    } catch (error) {
        next(error);
    }
};

// PUT /api/appointments/:id/start — doctor starts consultation
export const startConsultation = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const appointment = await Appointment.findByIdAndUpdate(
            req.params.id,
            { status: 'in_progress', 'consultation.startedAt': new Date() },
            { new: true }
        );
        if (!appointment) throw new AppError('Appointment not found', 404);
        res.status(200).json({ success: true, data: appointment });
    } catch (error) {
        next(error);
    }
};

// PUT /api/appointments/:id/end — doctor ends consultation
export const endConsultation = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const appointment = await Appointment.findById(req.params.id);
        if (!appointment) throw new AppError('Appointment not found', 404);

        const endedAt = new Date();
        const startedAt = appointment.consultation?.startedAt;
        const durationMinutes = startedAt
            ? Math.round((endedAt.getTime() - startedAt.getTime()) / 60000)
            : 0;

        const updated = await Appointment.findByIdAndUpdate(
            req.params.id,
            {
                status: 'completed',
                'consultation.endedAt': endedAt,
                'consultation.duration': durationMinutes,
            },
            { new: true }
        );

        // Credit doctor's earnings
        if (appointment.payment?.amount) {
            await Doctor.findByIdAndUpdate(appointment.doctorId, {
                $inc: {
                    totalEarnings: appointment.payment.amount,
                    pendingWithdrawal: appointment.payment.amount,
                },
            });
        }

        res.status(200).json({ success: true, data: updated });
    } catch (error) {
        next(error);
    }
};
