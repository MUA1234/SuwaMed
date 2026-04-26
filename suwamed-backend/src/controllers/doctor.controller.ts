import { Request, Response, NextFunction } from 'express';
import Doctor from '../models/Doctor.model';
import User from '../models/User.model';
import Appointment from '../models/Appointment.model';
import Review from '../models/Review.model';
import HealthRecord from '../models/HealthRecord.model';
import { AppError } from '../utils/errorResponse';
import { IAvailability } from '../models/Doctor.model';
import { uploadToCloudinary } from '../services/upload.service';

// GET /api/doctors — list doctors (with optional specialization filter)
export const getDoctors = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { specialization, search } = req.query;
        const filter: any = {};
        if (specialization) filter.specialization = specialization;

        let doctors = await Doctor.find(filter)
            .populate('userId', 'firstName lastName email phone avatar gender')
            .sort({ 'rating.average': -1 });

        if (search) {
            const s = (search as string).toLowerCase();
            doctors = doctors.filter((d: any) => {
                const u = d.userId;
                return (
                    u?.firstName?.toLowerCase().includes(s) ||
                    u?.lastName?.toLowerCase().includes(s) ||
                    d.specialization.some((sp: string) => sp.toLowerCase().includes(s))
                );
            });
        }

        res.status(200).json({ success: true, data: doctors });
    } catch (error) {
        next(error);
    }
};

// GET /api/doctors/:id — single doctor
export const getDoctorById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const doctor = await Doctor.findById(req.params.id)
            .populate('userId', 'firstName lastName email phone avatar gender district');
        if (!doctor) throw new AppError('Doctor not found', 404);
        res.status(200).json({ success: true, data: doctor });
    } catch (error) {
        next(error);
    }
};

// GET /api/doctors/profile — logged-in doctor's profile
export const getDoctorProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userId = (req as any).user.id;
        const doctor = await Doctor.findOne({ userId })
            .populate('userId', 'firstName lastName email phone avatar gender');
        if (!doctor) throw new AppError('Doctor profile not found', 404);
        res.status(200).json({ success: true, data: doctor });
    } catch (error) {
        next(error);
    }
};

// GET /api/doctors/dashboard — dashboard stats for logged-in doctor
export const getDashboardStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userId = (req as any).user.id;
        const doctor = await Doctor.findOne({ userId });
        if (!doctor) throw new AppError('Doctor not found', 404);

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const [todayAppointments, totalPatients, recentAppointments] = await Promise.all([
            Appointment.find({
                doctorId: doctor._id,
                date: { $gte: today, $lt: tomorrow },
            }).populate('patientId', 'firstName lastName avatar'),
            Appointment.distinct('patientId', { doctorId: doctor._id }),
            Appointment.find({ doctorId: doctor._id })
                .sort({ updatedAt: -1 })
                .limit(5)
                .populate('patientId', 'firstName lastName'),
        ]);

        // Calculate today's earnings
        const todayEarnings = todayAppointments
            .filter((a) => a.status === 'completed')
            .reduce((sum, a) => sum + (a.payment?.amount || 0), 0);

        res.status(200).json({
            success: true,
            data: {
                todayAppointments,
                todayAppointmentsCount: todayAppointments.length,
                totalPatients: totalPatients.length,
                todayEarnings,
                rating: doctor.rating,
                totalEarnings: doctor.totalEarnings,
                pendingWithdrawal: doctor.pendingWithdrawal,
                recentAppointments,
            },
        });
    } catch (error) {
        next(error);
    }
};

// GET /api/doctors/patients — patients of this doctor
export const getPatients = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userId = (req as any).user.id;
        const doctor = await Doctor.findOne({ userId });
        if (!doctor) throw new AppError('Doctor not found', 404);

        // Find all unique patients who had appointments with this doctor
        const patientIds = await Appointment.distinct('patientId', { doctorId: doctor._id });
        const patients = await User.find({ _id: { $in: patientIds } }).select(
            'firstName lastName email phone avatar gender dateOfBirth'
        );

        // Enrich with last visit and visit count
        const enriched = await Promise.all(
            patients.map(async (p) => {
                const [lastAppt, count] = await Promise.all([
                    Appointment.findOne({ doctorId: doctor._id, patientId: p._id })
                        .sort({ date: -1 })
                        .select('date status reason symptoms'),
                    Appointment.countDocuments({ doctorId: doctor._id, patientId: p._id }),
                ]);
                return {
                    ...p.toObject(),
                    lastAppointment: lastAppt,
                    totalVisits: count,
                };
            })
        );

        res.status(200).json({ success: true, data: enriched });
    } catch (error) {
        next(error);
    }
};

// GET /api/doctors/patients/:id — single patient detail for doctor
export const getPatientDetail = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userId = (req as any).user.id;
        const doctor = await Doctor.findOne({ userId });
        if (!doctor) throw new AppError('Doctor not found', 404);

        const patient = await User.findById(req.params.id).select(
            'firstName lastName email phone avatar gender dateOfBirth'
        );
        if (!patient) throw new AppError('Patient not found', 404);

        const [lastAppt, count] = await Promise.all([
            Appointment.findOne({ doctorId: doctor._id, patientId: patient._id })
                .sort({ date: -1 })
                .select('date status reason symptoms'),
            Appointment.countDocuments({ doctorId: doctor._id, patientId: patient._id }),
        ]);

        res.status(200).json({
            success: true,
            data: {
                ...patient.toObject(),
                lastAppointment: lastAppt,
                totalVisits: count,
            },
        });
    } catch (error) {
        next(error);
    }
};

// GET /api/doctors/:id/reviews
export const getDoctorReviews = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const reviews = await Review.find({ doctorId: req.params.id })
            .populate('patientId', 'firstName lastName avatar')
            .sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: reviews });
    } catch (error) {
        next(error);
    }
};

// GET /api/doctors/earnings — earnings for logged-in doctor
export const getEarnings = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userId = (req as any).user.id;
        const doctor = await Doctor.findOne({ userId });
        if (!doctor) throw new AppError('Doctor not found', 404);

        // Monthly earnings for the last 7 months
        const months = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setMonth(d.getMonth() - i);
            const start = new Date(d.getFullYear(), d.getMonth(), 1);
            const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
            const monthAppts = await Appointment.find({
                doctorId: doctor._id,
                status: 'completed',
                date: { $gte: start, $lte: end },
            });
            const total = monthAppts.reduce((sum, a) => sum + (a.payment?.amount || 0), 0);
            months.push({
                month: start.toLocaleString('default', { month: 'short' }),
                year: start.getFullYear(),
                amount: total,
            });
        }

        // Recent transactions (completed appointments)
        const recentAppts = await Appointment.find({
            doctorId: doctor._id,
            status: 'completed',
            'payment.amount': { $gt: 0 },
        })
            .sort({ date: -1 })
            .limit(10)
            .populate('patientId', 'firstName lastName');

        res.status(200).json({
            success: true,
            data: {
                totalEarnings: doctor.totalEarnings,
                pendingWithdrawal: doctor.pendingWithdrawal,
                monthlyEarnings: months,
                recentTransactions: recentAppts,
            },
        });
    } catch (error) {
        next(error);
    }
};

// POST /api/doctors/profile/avatar — upload doctor avatar image to Cloudinary, store URL on User.
export const uploadDoctorAvatar = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userId = (req as any).user.id;
        const file = (req as any).file as Express.Multer.File | undefined;
        if (!file) throw new AppError('avatar file is required', 400);
        if (!file.mimetype.startsWith('image/')) throw new AppError('Avatar must be an image', 400);

        const url = await uploadToCloudinary(file.buffer, `suwamed/avatars/${userId}`);
        const user = await User.findByIdAndUpdate(userId, { avatar: url }, { new: true })
            .select('-password -refreshToken');
        if (!user) throw new AppError('User not found', 404);

        res.status(200).json({ success: true, data: { avatar: url, user } });
    } catch (error) {
        next(error);
    }
};

// POST /api/doctors/verification-documents — upload one or more verification documents
// (image or PDF). Files are pushed to `Doctor.verificationDocuments` with the supplied
// `type` per file (e.g. `slmc_certificate`, `degree`, `nic`). When new documents are
// added we also flip `verificationStatus` from `pending` to `under_review` so admins
// know there's something fresh to review.
export const uploadDoctorVerificationDocuments = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userId = (req as any).user.id;
        const doctor = await Doctor.findOne({ userId });
        if (!doctor) throw new AppError('Doctor profile not found', 404);

        const files = ((req as any).files as Express.Multer.File[] | undefined) || [];
        if (files.length === 0) throw new AppError('At least one document is required', 400);

        // `types` may arrive as: a single string (one file), an array (multiple), or
        // a JSON-stringified array (some multipart clients). Pad out to the file count.
        let types: string[] = [];
        const rawTypes = req.body.types;
        if (Array.isArray(rawTypes)) {
            types = rawTypes.map((t: any) => String(t));
        } else if (typeof rawTypes === 'string' && rawTypes.trim()) {
            try {
                const parsed = JSON.parse(rawTypes);
                types = Array.isArray(parsed) ? parsed.map((t: any) => String(t)) : [rawTypes];
            } catch {
                types = [rawTypes];
            }
        }

        const uploaded = await Promise.all(
            files.map(async (file, idx) => {
                const url = await uploadToCloudinary(
                    file.buffer,
                    `suwamed/verification/${userId}`,
                );
                return {
                    type: types[idx] || 'other',
                    url,
                    uploadedAt: new Date(),
                };
            }),
        );

        doctor.verificationDocuments.push(...uploaded);
        if (doctor.verificationStatus === 'pending') {
            doctor.verificationStatus = 'under_review';
        }
        await doctor.save();

        res.status(200).json({
            success: true,
            data: {
                verificationDocuments: doctor.verificationDocuments,
                verificationStatus: doctor.verificationStatus,
            },
        });
    } catch (error) {
        next(error);
    }
};

// PUT /api/doctors/profile — update doctor's own profile fields
export const updateDoctorProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userId = (req as any).user.id;
        const doctor = await Doctor.findOne({ userId });
        if (!doctor) throw new AppError('Doctor profile not found', 404);

        const { bio, consultationFee, followUpFee, languages, hospital, clinicAddress } = req.body;

        const updateFields: any = {};
        if (bio !== undefined) updateFields.bio = bio;
        if (consultationFee !== undefined) updateFields.consultationFee = consultationFee;
        if (followUpFee !== undefined) updateFields.followUpFee = followUpFee;
        if (languages !== undefined) updateFields.languages = languages;
        if (hospital !== undefined) updateFields.hospital = hospital;
        if (clinicAddress !== undefined) updateFields.clinicAddress = clinicAddress;

        const updated = await Doctor.findByIdAndUpdate(doctor._id, updateFields, { new: true })
            .populate('userId', 'firstName lastName email phone avatar gender');

        res.status(200).json({ success: true, data: updated });
    } catch (error) {
        next(error);
    }
};

// GET /api/doctors/patients/:id/health-records — get health records for a specific patient (doctor access)
export const getPatientHealthRecords = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userId = (req as any).user.id;
        const doctor = await Doctor.findOne({ userId });
        if (!doctor) throw new AppError('Doctor not found', 404);

        // Verify that this patient has had at least one appointment with this doctor
        const hasRelationship = await Appointment.exists({ doctorId: doctor._id, patientId: req.params.id });
        if (!hasRelationship) throw new AppError('Patient not found or no appointment history', 403);

        const { category } = req.query;
        const filter: any = { patientId: req.params.id };
        if (category) filter.category = category;

        const records = await HealthRecord.find(filter).sort({ date: -1, createdAt: -1 });
        res.status(200).json({ success: true, data: records });
    } catch (error) {
        next(error);
    }
};

// PUT /api/doctors/availability — replace the doctor's availability schedule
export const setAvailability = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userId = (req as any).user.id;
        const doctor = await Doctor.findOne({ userId });
        if (!doctor) throw new AppError('Doctor profile not found', 404);

        const { availability } = req.body;
        if (!Array.isArray(availability)) {
            throw new AppError('availability must be an array', 400);
        }

        const updated = await Doctor.findByIdAndUpdate(
            doctor._id,
            { availability },
            { new: true }
        ).select('availability');

        res.status(200).json({ success: true, data: updated });
    } catch (error) {
        next(error);
    }
};

// GET /api/doctors/availability/:id — get a doctor's availability slots for a given date
export const getDoctorAvailability = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const doctor = await Doctor.findById(req.params.id).select('availability blockedSlots');
        if (!doctor) throw new AppError('Doctor not found', 404);

        const { date } = req.query;
        let targetDate: Date | undefined;
        if (date) {
            targetDate = new Date(date as string);
            if (isNaN(targetDate.getTime())) throw new AppError('Invalid date format', 400);
        }

        // Get day-of-week availability
        const dayOfWeek = targetDate ? targetDate.getDay() : undefined;
        const dayAvailability = dayOfWeek !== undefined
            ? doctor.availability.filter((a: IAvailability) => a.dayOfWeek === dayOfWeek && a.isActive)
            : doctor.availability.filter((a: IAvailability) => a.isActive);

        // Check for blocked slots on this date
        let blockedOnDate: typeof doctor.blockedSlots = [];
        if (targetDate) {
            const startOfDay = new Date(targetDate);
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(targetDate);
            endOfDay.setHours(23, 59, 59, 999);
            blockedOnDate = doctor.blockedSlots.filter((bs) => {
                return bs.date >= startOfDay && bs.date <= endOfDay;
            });
        }

        // If a date is provided, also check appointments booked on that day
        let bookedSlots: { startTime: string; endTime: string }[] = [];
        if (targetDate) {
            const startOfDay = new Date(targetDate);
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(targetDate);
            endOfDay.setHours(23, 59, 59, 999);

            const appointments = await Appointment.find({
                doctorId: doctor._id,
                date: { $gte: startOfDay, $lte: endOfDay },
                status: { $nin: ['cancelled', 'no_show'] },
            }).select('startTime endTime');

            bookedSlots = appointments.map((a) => ({ startTime: a.startTime, endTime: a.endTime }));
        }

        res.status(200).json({
            success: true,
            data: {
                availability: dayAvailability,
                blockedSlots: blockedOnDate,
                bookedSlots,
            },
        });
    } catch (error) {
        next(error);
    }
};
