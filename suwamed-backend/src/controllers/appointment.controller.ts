import { Request, Response, NextFunction } from 'express';
import Appointment from '../models/Appointment.model';
import Doctor from '../models/Doctor.model';
import Payment from '../models/Payment.model';
import { AppError } from '../utils/errorResponse';
import { sendToUser, sendToUsers } from '../services/notification.service';

// Resolve a Doctor _id back to the underlying User _id, used so we can target
// notifications to the doctor's account (User row), not the Doctor profile row.
async function resolveDoctorUserId(doctorId: unknown): Promise<string | null> {
  try {
    const doc = await Doctor.findById(doctorId).select('userId').lean();
    return doc ? String((doc as { userId: unknown }).userId) : null;
  } catch {
    return null;
  }
}

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
        const transactionId = `CASH-${Date.now()}-${req.params.id.slice(-6)}`;
        const appointment = await Appointment.findByIdAndUpdate(
            req.params.id,
            {
                status: 'confirmed',
                'payment.status': 'completed',
                'payment.paidAt': new Date(),
                'payment.transactionId': transactionId,
            },
            { new: true }
        );
        if (!appointment) throw new AppError('Appointment not found', 404);

        // Persist a Payment record so Payment History / invoices have data to render.
        // Idempotent: if this appointment already has a completed payment, skip.
        const alreadyPaid = await Payment.findOne({
            appointmentId: appointment._id,
            status: 'completed',
        });
        if (!alreadyPaid && appointment.payment?.amount) {
            await Payment.create({
                userId: appointment.patientId,
                type: 'consultation',
                amount: appointment.payment.amount,
                currency: 'LKR',
                status: 'completed',
                gateway: 'cash',
                transactionId,
                appointmentId: appointment._id,
            });
        }

        // Notify both sides that the booking is now confirmed.
        const doctorUserId = await resolveDoctorUserId(appointment.doctorId);
        const targets = [String(appointment.patientId), ...(doctorUserId ? [doctorUserId] : [])];
        const slot = `${(appointment.date as Date).toISOString().slice(0, 10)} ${appointment.startTime}`;
        await sendToUsers(targets, {
            type: 'appointment_confirmed',
            title: 'Appointment confirmed',
            body: `Your consultation is confirmed for ${slot}.`,
            data: { appointmentId: String(appointment._id), startTime: appointment.startTime },
        });

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

        const doctorUserId = await resolveDoctorUserId(appointment.doctorId);
        const targets = [String(appointment.patientId), ...(doctorUserId ? [doctorUserId] : [])];
        await sendToUsers(targets, {
            type: 'appointment_cancelled',
            title: 'Appointment cancelled',
            body: req.body.reason
                ? `Cancellation reason: ${String(req.body.reason).slice(0, 200)}`
                : 'Your appointment has been cancelled.',
            data: { appointmentId: String(appointment._id) },
        });

        res.status(200).json({ success: true, data: appointment });
    } catch (error) {
        next(error);
    }
};

// PUT /api/appointments/:id/reschedule — patient or doctor moves the slot
export const rescheduleAppointment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userId = (req as any).user.id;
        const role = (req as any).user.role;
        const { date, startTime, endTime, reason } = req.body;

        if (!date || !startTime || !endTime) {
            throw new AppError('date, startTime and endTime are required', 400);
        }

        const appointment = await Appointment.findById(req.params.id);
        if (!appointment) throw new AppError('Appointment not found', 404);

        if (['completed', 'cancelled'].includes(appointment.status)) {
            throw new AppError(`Cannot reschedule a ${appointment.status} appointment`, 400);
        }

        // Authorization — patient owns it, or doctor owns it
        if (role === 'patient' && String(appointment.patientId) !== String(userId)) {
            throw new AppError('Not authorized', 403);
        }
        if (role === 'doctor') {
            const doctor = await Doctor.findOne({ userId });
            if (!doctor || String(appointment.doctorId) !== String(doctor._id)) {
                throw new AppError('Not authorized', 403);
            }
        }

        const previousSlot = `${appointment.date.toISOString().slice(0, 10)} ${appointment.startTime}-${appointment.endTime}`;
        const auditNote = `[Rescheduled by ${role} on ${new Date().toISOString()} from ${previousSlot}${reason ? `: ${reason}` : ''}]`;
        const combinedNotes = appointment.notes ? `${appointment.notes}\n${auditNote}` : auditNote;

        const updated = await Appointment.findByIdAndUpdate(
            req.params.id,
            {
                date,
                startTime,
                endTime,
                status: 'pending',
                notes: combinedNotes,
            },
            { new: true }
        );

        res.status(200).json({ success: true, data: updated });
    } catch (error) {
        next(error);
    }
};

// PUT /api/appointments/:id/notes — doctor adds consultation notes
export const addAppointmentNotes = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userId = (req as any).user.id;
        const role = (req as any).user.role;
        const { notes } = req.body;

        if (typeof notes !== 'string' || !notes.trim()) {
            throw new AppError('notes is required', 400);
        }
        if (notes.length > 5000) {
            throw new AppError('notes too long (max 5000 chars)', 400);
        }

        const appointment = await Appointment.findById(req.params.id);
        if (!appointment) throw new AppError('Appointment not found', 404);

        if (role === 'doctor') {
            const doctor = await Doctor.findOne({ userId });
            if (!doctor || String(appointment.doctorId) !== String(doctor._id)) {
                throw new AppError('Not authorized', 403);
            }
        } else if (role !== 'admin') {
            throw new AppError('Only the assigned doctor can add notes', 403);
        }

        const updated = await Appointment.findByIdAndUpdate(
            req.params.id,
            { notes: notes.trim() },
            { new: true }
        );

        res.status(200).json({ success: true, data: updated });
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

        // Ping the patient that the doctor has joined / started the session.
        await sendToUser({
            userId: String(appointment.patientId),
            type: 'consultation_started',
            title: 'Your doctor is ready',
            body: 'Your consultation has started. Open the app to join.',
            data: { appointmentId: String(appointment._id) },
        });

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

        // Ask the patient for a review now that the consultation is over.
        await sendToUser({
            userId: String(appointment.patientId),
            type: 'review_request',
            title: 'How was your consultation?',
            body: 'Leave a quick review to help other patients choose the right doctor.',
            data: { appointmentId: String(appointment._id) },
        });

        res.status(200).json({ success: true, data: updated });
    } catch (error) {
        next(error);
    }
};
