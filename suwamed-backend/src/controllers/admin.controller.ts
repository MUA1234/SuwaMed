import { Request, Response, NextFunction } from 'express';
import User from '../models/User.model';
import Doctor from '../models/Doctor.model';
import Patient from '../models/Patient.model';
import Appointment from '../models/Appointment.model';
import { AppError } from '../utils/errorResponse';
import { sendToUser } from '../services/notification.service';
import { logEvent } from '../services/systemLog.service';

// GET /api/admin/dashboard — overall platform stats
export const getDashboard = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const [totalUsers, totalDoctors, totalAppointments, pendingVerifications, revenueResult] = await Promise.all([
      User.countDocuments(),
      Doctor.countDocuments(),
      Appointment.countDocuments(),
      Doctor.countDocuments({ verificationStatus: 'pending' }),
      Appointment.aggregate([
        { $match: { status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$payment.amount' } } },
      ]),
    ]);

    const totalRevenue = revenueResult.length > 0 ? revenueResult[0].total : 0;

    res.status(200).json({
      success: true,
      data: {
        totalUsers,
        totalDoctors,
        totalAppointments,
        totalRevenue,
        pendingVerifications,
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/admin/users — list all users with pagination and optional search
export const getUsers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, parseInt(req.query.limit as string) || 20);
    const skip = (page - 1) * limit;
    const search = (req.query.search as string) || '';

    const filter: any = {};
    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }

    const [users, total] = await Promise.all([
      User.find(filter)
        .select('-password -refreshToken -otp -otpExpiresAt')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      User.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      data: users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/admin/users/:id — single user with patient or doctor info
export const getUserById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await User.findById(req.params.id).select('-password -refreshToken -otp -otpExpiresAt');
    if (!user) throw new AppError('User not found', 404);

    let roleData: any = null;
    if (user.role === 'patient') {
      roleData = await Patient.findOne({ userId: user._id });
    } else if (user.role === 'doctor') {
      roleData = await Doctor.findOne({ userId: user._id });
    }

    res.status(200).json({ success: true, data: { user, roleData } });
  } catch (error) {
    next(error);
  }
};

// GET /api/admin/doctors/pending — list doctors awaiting verification (paginated + searchable)
export const getPendingDoctors = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, parseInt(req.query.limit as string) || 20);
    const skip = (page - 1) * limit;
    const search = (req.query.search as string) || '';

    const filter: any = { verificationStatus: 'pending' };
    if (search) {
      // Search SLMC number / specialization on the Doctor doc
      filter.$or = [
        { slmcRegistrationNo: { $regex: search, $options: 'i' } },
        { specialization: { $elemMatch: { $regex: search, $options: 'i' } } },
      ];
    }

    const [doctors, total] = await Promise.all([
      Doctor.find(filter)
        .populate('userId', 'firstName lastName email phone avatar createdAt')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Doctor.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      data: doctors,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/admin/doctors/:id/verify — approve a doctor
export const verifyDoctor = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const adminId = (req as any).user.id;

    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) throw new AppError('Doctor not found', 404);

    const updated = await Doctor.findByIdAndUpdate(
      req.params.id,
      { verificationStatus: 'verified', verifiedBy: adminId, verifiedAt: new Date() },
      { new: true }
    ).populate('userId', 'firstName lastName email phone');

    if (doctor.userId) {
      await sendToUser({
        userId: String(doctor.userId),
        type: 'doctor_verified',
        title: 'You are verified',
        body: 'Your SLMC registration has been approved. You can now accept appointments on SuwaMed.',
        data: { doctorId: String(doctor._id) },
      });
    }

    await logEvent('admin.doctor.verify', {
      actorId: adminId,
      targetId: String(doctor._id),
      req,
      details: { userId: String(doctor.userId) },
    });

    res.status(200).json({
      success: true,
      message: 'Doctor verified successfully',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/admin/doctors/:id/reject — reject a doctor application
export const rejectDoctor = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const adminId = (req as any).user.id;
    const { reason } = req.body;

    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) throw new AppError('Doctor not found', 404);

    const updated = await Doctor.findByIdAndUpdate(
      req.params.id,
      { verificationStatus: 'rejected', verifiedBy: adminId, verifiedAt: new Date() },
      { new: true }
    ).populate('userId', 'firstName lastName email phone');

    if (doctor.userId) {
      await sendToUser({
        userId: String(doctor.userId),
        type: 'doctor_rejected',
        title: 'Verification update',
        body: reason
          ? `Your verification was not approved: ${String(reason).slice(0, 200)}`
          : 'Your verification application was not approved. Please contact support for details.',
        data: { doctorId: String(doctor._id) },
      });
    }

    await logEvent('admin.doctor.reject', {
      actorId: adminId,
      targetId: String(doctor._id),
      req,
      details: { reason: reason ?? null },
    });

    res.status(200).json({
      success: true,
      message: 'Doctor application rejected',
      data: updated,
      ...(reason && { reason }),
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/admin/users/:id/status — activate or suspend a user account
export const updateUserStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { status } = req.body;
    if (!status || !['active', 'suspended', 'inactive'].includes(status)) {
      throw new AppError('status must be "active", "suspended", or "inactive"', 400);
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive: status === 'active' },
      { new: true }
    ).select('-password -refreshToken -otp -otpExpiresAt');

    await logEvent('admin.user.status', {
      actorId: (req as any).user.id,
      targetId: String(req.params.id),
      req,
      details: { status },
    });

    if (!user) throw new AppError('User not found', 404);

    res.status(200).json({
      success: true,
      message: `User status updated to ${status}`,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/admin/appointment-analytics — monthly appointment counts + status breakdown
export const getAppointmentAnalytics = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const months: { month: string; year: number; count: number }[] = [];

    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const start = new Date(d.getFullYear(), d.getMonth(), 1);
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
      const count = await Appointment.countDocuments({ date: { $gte: start, $lte: end } });
      months.push({ month: start.toLocaleString('default', { month: 'short' }), year: start.getFullYear(), count });
    }

    const [statusBreakdown, typeBreakdown] = await Promise.all([
      Appointment.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      Appointment.aggregate([{ $group: { _id: '$type', count: { $sum: 1 } } }]),
    ]);

    const statusMap: Record<string, number> = {};
    for (const s of statusBreakdown) statusMap[s._id] = s.count;

    const typeMap: Record<string, number> = {};
    for (const t of typeBreakdown) typeMap[t._id] = t.count;

    res.status(200).json({
      success: true,
      data: { monthlyAppointments: months, statusBreakdown: statusMap, typeBreakdown: typeMap },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/admin/revenue — monthly revenue for last 6 months
export const getRevenue = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const months: { month: string; year: number; amount: number }[] = [];

    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const start = new Date(d.getFullYear(), d.getMonth(), 1);
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);

      const result = await Appointment.aggregate([
        {
          $match: {
            status: 'completed',
            date: { $gte: start, $lte: end },
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$payment.amount' },
            count: { $sum: 1 },
          },
        },
      ]);

      months.push({
        month: start.toLocaleString('default', { month: 'short' }),
        year: start.getFullYear(),
        amount: result.length > 0 ? result[0].total : 0,
      });
    }

    const totalRevenue = months.reduce((sum, m) => sum + m.amount, 0);

    res.status(200).json({
      success: true,
      data: {
        monthlyRevenue: months,
        totalRevenue,
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/admin/system-logs — paginated audit trail.
export const getSystemLogs = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { default: SystemLog } = await import('../models/SystemLog.model');
    const { page = '1', limit = '50', action } = req.query as Record<string, string>;
    const p = Math.max(parseInt(page, 10) || 1, 1);
    const l = Math.min(Math.max(parseInt(limit, 10) || 50, 1), 200);
    const filter: Record<string, unknown> = {};
    if (action) filter.action = action;
    const [logs, total] = await Promise.all([
      SystemLog.find(filter)
        .populate('userId', 'firstName lastName email role')
        .sort({ createdAt: -1 })
        .skip((p - 1) * l)
        .limit(l)
        .lean(),
      SystemLog.countDocuments(filter),
    ]);
    res.status(200).json({ success: true, data: logs, total, page: p, limit: l });
  } catch (error) {
    next(error);
  }
};
