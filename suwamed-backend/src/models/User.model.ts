import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IAddress {
  street?: string;
  city?: string;
  district?: string;
  province?: string;
  postalCode?: string;
}

export interface IUser extends Document {
  email: string;
  phone: string;
  password: string;
  role: 'patient' | 'doctor' | 'admin';
  firstName: string;
  lastName: string;
  displayName?: string;
  avatar?: string;
  dateOfBirth?: Date;
  gender?: 'male' | 'female' | 'other';
  address?: IAddress;
  language: 'en' | 'si' | 'ta';
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  isActive: boolean;
  fcmTokens: string[];
  lastLogin?: Date;
  refreshToken?: string;
  otp?: string;
  otpExpiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
  compareOtp(candidateOtp: string): Promise<boolean>;
  compareRefreshToken(candidate: string): Promise<boolean>;
}

const addressSchema = new Schema(
  {
    street: { type: String },
    city: { type: String },
    district: { type: String },
    province: { type: String },
    postalCode: { type: String },
  },
  { _id: false }
);

const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      select: false,
    },
    role: {
      type: String,
      enum: ['patient', 'doctor', 'admin'],
      required: true,
    },
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    displayName: { type: String },
    avatar: { type: String },
    dateOfBirth: { type: Date },
    gender: {
      type: String,
      enum: ['male', 'female', 'other'],
    },
    address: { type: addressSchema },
    language: {
      type: String,
      enum: ['en', 'si', 'ta'],
      default: 'en',
    },
    isEmailVerified: { type: Boolean, default: false },
    isPhoneVerified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    fcmTokens: [{ type: String }],
    lastLogin: { type: Date },
    refreshToken: { type: String, select: false },
    otp: { type: String, select: false },
    otpExpiresAt: { type: Date, select: false },
  },
  { timestamps: true }
);

userSchema.index({ email: 1 });
userSchema.index({ phone: 1 });

userSchema.pre('save', async function () {
  if (this.isModified('password')) {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
  }
  // Hash OTP at rest. Use fewer rounds (8) than password — OTPs are short-lived
  // (5-min expiry) and the rate-limited verify endpoint already blocks brute force.
  // Skip when otp has been cleared (set to undefined after successful verify/expiry).
  if (this.isModified('otp') && this.otp) {
    const salt = await bcrypt.genSalt(8);
    this.otp = await bcrypt.hash(this.otp, salt);
  }
  // Hash refresh token at rest so a DB read alone cannot impersonate the user.
  // Skip on logout (token cleared to undefined).
  if (this.isModified('refreshToken') && this.refreshToken) {
    const salt = await bcrypt.genSalt(8);
    this.refreshToken = await bcrypt.hash(this.refreshToken, salt);
  }
});

userSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.compareOtp = async function (
  candidateOtp: string
): Promise<boolean> {
  if (!this.otp) return false;
  return bcrypt.compare(candidateOtp, this.otp);
};

userSchema.methods.compareRefreshToken = async function (
  candidate: string
): Promise<boolean> {
  if (!this.refreshToken) return false;
  return bcrypt.compare(candidate, this.refreshToken);
};

const User = mongoose.model<IUser>('User', userSchema);

export default User;
