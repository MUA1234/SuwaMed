import bcrypt from 'bcryptjs';
import User, { IUser } from '../models/User.model';
import Patient from '../models/Patient.model';
import Doctor from '../models/Doctor.model';
import SlmcRegistry from '../models/SlmcRegistry.model';
import HealthRecord from '../models/HealthRecord.model';
import Notification from '../models/Notification.model';
import SymptomCheck from '../models/SymptomCheck.model';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/tokenUtils';
import { AppError } from '../utils/errorResponse';
import { generateOTP } from '../utils/helpers';
import logger from '../utils/logger';
import { sendOtpEmail, sendPasswordResetEmail } from './email.service';

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

    // Deliver the OTP. Email is the primary channel — SMS would require Twilio +
    // a paid phone-number lease and is out of scope for the launch. The email
    // service is best-effort: if it fails or no provider is configured, we still
    // surface the OTP in the dev console so onboarding doesn't break.
    await sendOtpEmail(user.email, otp, 'Verify your SuwaMed account');
    if (process.env.NODE_ENV === 'development') {
      logger.info(`OTP for ${user.phone} / ${user.email}: ${otp}`);
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

    const isMatch = await user.compareOtp(otp);
    if (!isMatch) {
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

    const user = await User.findById(decoded.id).select('+refreshToken');

    if (!user) {
      throw new AppError('Invalid refresh token', 401);
    }

    const isMatch = await user.compareRefreshToken(token);
    if (!isMatch) {
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

    await sendPasswordResetEmail(user.email, otp);
    if (process.env.NODE_ENV === 'development') {
      logger.info(`Password Reset OTP for ${emailOrPhone} / ${user.email}: ${otp}`);
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

    const isMatch = await user.compareOtp(otp);
    if (!isMatch) {
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

  // Play Store / GDPR — users must be able to delete their account.
  // We anonymize rather than hard-delete because Appointment / Payment / Prescription
  // documents reference this user and are needed for the doctor's billing & medical
  // record retention. The user document is kept but stripped of every identifier so
  // the account can no longer be recognized or recovered.
  static async deleteAccount(userId: string, password: string) {
    const user = await User.findById(userId).select('+password');

    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Re-authenticate so a stolen access token cannot wipe an account.
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new AppError('Password is incorrect', 401);
    }

    // Hard-delete records that exist solely to serve this user.
    if (user.role === 'patient') {
      await Patient.deleteOne({ userId: user._id });
      await HealthRecord.deleteMany({ patientId: user._id });
      await SymptomCheck.deleteMany({ patientId: user._id });
    } else if (user.role === 'doctor') {
      await Doctor.deleteOne({ userId: user._id });
    }
    await Notification.deleteMany({ userId: user._id });

    // Anonymize the user record. We keep `_id` so foreign keys in Appointments,
    // Reviews, Payments and Prescriptions continue to resolve, but every PII field
    // is wiped. A unique tombstone email/phone keeps the unique indexes happy and
    // makes deleted accounts visible in the DB if support ever needs to audit one.
    const tombstone = `deleted-${user._id.toString()}`;
    user.email = `${tombstone}@deleted.suwamed.local`;
    user.phone = `+0000000000${user._id.toString().slice(-6)}`;
    user.firstName = 'Deleted';
    user.lastName = 'User';
    user.displayName = 'Deleted User';
    user.avatar = undefined;
    user.dateOfBirth = undefined;
    user.gender = undefined;
    user.address = undefined;
    user.fcmTokens = [];
    user.refreshToken = undefined;
    user.otp = undefined;
    user.otpExpiresAt = undefined;
    user.isActive = false;
    user.isEmailVerified = false;
    user.isPhoneVerified = false;
    // Reset the password to a random unguessable value so login is impossible.
    user.password = await bcrypt.hash(`deleted-${Date.now()}-${Math.random()}`, 12);

    await user.save({ validateBeforeSave: false });

    logger.info(`Account deleted for user ${userId} (role=${user.role})`);
    return { message: 'Account deleted successfully' };
  }
}
