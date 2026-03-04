import User, { IUser } from '../models/User.model';
import Patient from '../models/Patient.model';
import Doctor from '../models/Doctor.model';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/tokenUtils';
import { AppError } from '../utils/errorResponse';
import { generateOTP } from '../utils/helpers';
import logger from '../utils/logger';

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
    // Temporarily disabled for testing — allows duplicate email/phone
    // const existingUser = await User.findOne({
    //   $or: [{ email: data.email }, { phone: data.phone }],
    // });
    //
    // if (existingUser) {
    //   throw new AppError('User with this email or phone already exists', 400);
    // }

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

    // Generate and store OTP for phone verification
    const otp = generateOTP();
    user.otp = otp;
    user.otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
    await user.save({ validateBeforeSave: false });

    // Log OTP to console for development (replace with SMS provider in production)
    logger.info(`📱 OTP for ${user.phone}: ${otp}`);
    console.log(`\n========================================`);
    console.log(`  📱 OTP for ${user.phone}: ${otp}`);
    console.log(`========================================\n`);

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
    const user = await User.findOne({ phone }).select('+otp +otpExpiresAt');

    if (!user) {
      throw new AppError('User not found', 404);
    }

    if (!user.otp || !user.otpExpiresAt) {
      throw new AppError('No OTP was generated. Please request a new one.', 400);
    }

    if (new Date() > user.otpExpiresAt) {
      user.otp = undefined;
      user.otpExpiresAt = undefined;
      await user.save({ validateBeforeSave: false });
      throw new AppError('OTP has expired. Please request a new one.', 400);
    }

    if (user.otp !== otp) {
      throw new AppError('Invalid OTP. Please try again.', 400);
    }

    // OTP is valid — mark phone as verified and clear OTP
    user.isPhoneVerified = true;
    user.otp = undefined;
    user.otpExpiresAt = undefined;
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

    user.otp = otp;
    user.otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000);
    await user.save({ validateBeforeSave: false });

    logger.info(`📱 Password Reset OTP for ${emailOrPhone}: ${otp}`);
    console.log(`\n========================================`);
    console.log(`  🔑 Reset OTP for ${emailOrPhone}: ${otp}`);
    console.log(`========================================\n`);

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
