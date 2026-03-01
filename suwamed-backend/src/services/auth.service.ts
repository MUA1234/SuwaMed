import User, { IUser } from '../models/User.model';
import Patient from '../models/Patient.model';
import Doctor from '../models/Doctor.model';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/tokenUtils';
import { AppError } from '../utils/errorResponse';
import { generateOTP } from '../utils/helpers';

export class AuthService {
  static async register(data: {
    email: string;
    phone: string;
    password: string;
    firstName: string;
    lastName: string;
    role: string;
    dateOfBirth?: Date;
    gender?: string;
    district?: string;
    slmcRegistrationNo?: string;
    specialization?: string[];
    qualifications?: { degree: string; institution: string; year: number }[];
    experience?: number;
    bio?: string;
    consultationFee?: number;
    followUpFee?: number;
    languages?: string[];
  }) {
    const existingUser = await User.findOne({
      $or: [{ email: data.email }, { phone: data.phone }],
    });

    if (existingUser) {
      throw new AppError('User with this email or phone already exists', 400);
    }

    const user = await User.create({
      email: data.email,
      phone: data.phone,
      password: data.password,
      firstName: data.firstName,
      lastName: data.lastName,
      role: data.role,
      displayName: `${data.firstName} ${data.lastName}`,
      dateOfBirth: data.dateOfBirth,
      gender: data.gender,
      address: data.district ? { district: data.district } : undefined,
    });

    if (data.role === 'patient') {
      await Patient.create({
        userId: user._id,
      });
    } else if (data.role === 'doctor') {
      await Doctor.create({
        userId: user._id,
        slmcRegistrationNo: data.slmcRegistrationNo,
        specialization: data.specialization || [],
        qualifications: data.qualifications || [],
        experience: data.experience,
        bio: data.bio,
        consultationFee: data.consultationFee || 0,
        followUpFee: data.followUpFee,
        languages: data.languages || ['en'],
        verificationStatus: 'pending',
      });
    }

    const accessToken = generateAccessToken(user._id.toString(), user.role);
    const refreshTokenValue = generateRefreshToken(user._id.toString());

    user.refreshToken = refreshTokenValue;
    await user.save({ validateBeforeSave: false });

    const userObj = user.toObject();
    delete (userObj as any).password;

    return {
      user: userObj,
      accessToken,
      refreshToken: refreshTokenValue,
    };
  }

  static async login(emailOrPhone: string, password: string) {
    const user = await User.findOne({
      $or: [{ email: emailOrPhone }, { phone: emailOrPhone }],
    }).select('+password');

    if (!user) {
      throw new AppError('Invalid credentials', 401);
    }

    if (!user.isActive) {
      throw new AppError('Account is deactivated', 403);
    }

    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      throw new AppError('Invalid credentials', 401);
    }

    const accessToken = generateAccessToken(user._id.toString(), user.role);
    const refreshTokenValue = generateRefreshToken(user._id.toString());

    user.lastLogin = new Date();
    user.refreshToken = refreshTokenValue;
    await user.save({ validateBeforeSave: false });

    const userObj = user.toObject();
    delete (userObj as any).password;

    return {
      user: userObj,
      accessToken,
      refreshToken: refreshTokenValue,
    };
  }

  static async verifyOTP(phone: string, otp: string) {
    const user = await User.findOne({ phone });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    if (otp.length !== 6) {
      throw new AppError('Invalid OTP', 400);
    }

    user.isPhoneVerified = true;
    await user.save({ validateBeforeSave: false });

    return { message: 'Phone number verified successfully' };
  }

  static async refreshToken(token: string) {
    const decoded = verifyRefreshToken(token);

    const user = await User.findById(decoded.id);

    if (!user || user.refreshToken !== token) {
      throw new AppError('Invalid refresh token', 401);
    }

    const accessToken = generateAccessToken(user._id.toString(), user.role);
    const refreshTokenValue = generateRefreshToken(user._id.toString());

    user.refreshToken = refreshTokenValue;
    await user.save({ validateBeforeSave: false });

    return {
      accessToken,
      refreshToken: refreshTokenValue,
    };
  }

  static async forgotPassword(emailOrPhone: string) {
    const user = await User.findOne({
      $or: [{ email: emailOrPhone }, { phone: emailOrPhone }],
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    const otp = generateOTP();

    return { message: 'OTP sent successfully' };
  }

  static async resetPassword(emailOrPhone: string, otp: string, newPassword: string) {
    const user = await User.findOne({
      $or: [{ email: emailOrPhone }, { phone: emailOrPhone }],
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    if (otp.length !== 6) {
      throw new AppError('Invalid OTP', 400);
    }

    user.password = newPassword;
    await user.save();

    return { message: 'Password reset successfully' };
  }

  static async logout(userId: string) {
    const user = await User.findById(userId);

    if (!user) {
      throw new AppError('User not found', 404);
    }

    user.refreshToken = undefined;
    await user.save({ validateBeforeSave: false });

    return { message: 'Logged out successfully' };
  }
}
