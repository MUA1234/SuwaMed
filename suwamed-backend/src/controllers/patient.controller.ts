import { Request, Response, NextFunction } from 'express';
import Patient from '../models/Patient.model';
import User from '../models/User.model';
import { AppError } from '../utils/errorResponse';
import { uploadToCloudinary } from '../services/upload.service';

// GET /api/patients/profile — get logged-in patient profile
export const getProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userId = (req as any).user.id;
        const user = await User.findById(userId).select('-password -refreshToken');
        const patient = await Patient.findOne({ userId });

        if (!user) throw new AppError('User not found', 404);

        res.status(200).json({
            success: true,
            data: {
                user,
                patient,
            },
        });
    } catch (error) {
        next(error);
    }
};

// PUT /api/patients/profile — update patient profile
export const updateProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userId = (req as any).user.id;
        const { bloodGroup, height, weight, allergies, chronicConditions, emergencyContact } = req.body;

        const patient = await Patient.findOneAndUpdate(
            { userId },
            { bloodGroup, height, weight, allergies, chronicConditions, emergencyContact },
            { new: true }
        );

        res.status(200).json({ success: true, data: patient });
    } catch (error) {
        next(error);
    }
};

// POST /api/patients/profile/avatar — upload avatar image to Cloudinary, store URL on User.
export const uploadAvatar = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
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

// PUT /api/patients/user — update core user fields (firstName, lastName, phone, etc.)
export const updateUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userId = (req as any).user.id;
        const { firstName, lastName, phone, gender, dateOfBirth, district } = req.body;

        const updateFields: any = {};
        if (firstName !== undefined) updateFields.firstName = firstName;
        if (lastName !== undefined) updateFields.lastName = lastName;
        if (phone !== undefined) updateFields.phone = phone;
        if (gender !== undefined) updateFields.gender = gender;
        if (dateOfBirth !== undefined) updateFields.dateOfBirth = dateOfBirth;
        if (district !== undefined) updateFields['address.district'] = district;

        const user = await User.findByIdAndUpdate(userId, updateFields, { new: true })
            .select('-password -refreshToken');

        if (!user) throw new AppError('User not found', 404);

        res.status(200).json({ success: true, data: user });
    } catch (error) {
        next(error);
    }
};
