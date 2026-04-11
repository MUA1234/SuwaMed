import User, { IUser } from '../models/User.model';
import Patient from '../models/Patient.model';
import Doctor from '../models/Doctor.model';
import SlmcRegistry from '../models/SlmcRegistry.model';
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
      // Validate and mark SLMC number as used
      if (data.slmcRegistrationNo) {
        const slmcRecord = await SlmcRegistry.findOne({ slmcNo: data.slmcRegistrationNo.toUpperCase() });
        if (slmcRecord && !slmcRecord.isUsed) {
          slmcRecord.isUsed = true;
          await slmcRecord.save();
        }
      }

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

    // In production, send OTP via SMS (Twilio/similar). In dev, log for debugging.
    if (process.env.NODE_ENV === 'development') {
      logger.info(`OTP for ${user.phone}: ${otp}`);
    }

    const userObj: any = user.toObject();
    delete userObj.password;

    // Attach verificationStatus for doctors
    if (data.role === 'doctor') {
      userObj.verificationStatus = 'pending';
    }

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

    const userObj: any = user.toObject();
    delete userObj.password;

    // Attach doctor verificationStatus so frontend can gate access
    if (user.role === 'doctor') {
      const doctor = await Doctor.findOne({ userId: user._id }).select('verificationStatus');
      if (doctor) {
        userObj.verificationStatus = doctor.verificationStatus;
      }
    }

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

    // In production, send OTP via SMS/email. In dev, log for debugging.
    if (process.env.NODE_ENV === 'development') {
      logger.info(`Password Reset OTP for ${emailOrPhone}: ${otp}`);
    }

    return { message: 'OTP sent successfully' };
  }

  static async resetPassword(emailOrPhone: string, otp: string, newPassword: string) {
    const user = await User.findOne({
      $or: [{ email: emailOrPhone }, { phone: emailOrPhone }],
    }).select('+otp +otpExpiresAt');

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

    // OTP verified — reset password and clear OTP
    user.password = newPassword;
    user.otp = undefined;
    user.otpExpiresAt = undefined;
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
