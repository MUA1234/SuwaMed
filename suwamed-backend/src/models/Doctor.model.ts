import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IQualification {
  degree?: string;
  institution?: string;
  year?: number;
}

export interface IAvailability {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  slotDuration: number;
  isActive: boolean;
}

export interface IBlockedSlot {
  date: Date;
  startTime: string;
  endTime: string;
  reason?: string;
}

export interface IRating {
  average: number;
  count: number;
}

export interface IVerificationDocument {
  type: string;
  url: string;
  uploadedAt: Date;
}

export interface IBankDetails {
  bankName?: string;
  branchName?: string;
  accountNo?: string;
  accountName?: string;
}

export interface IDoctor extends Document {
  userId: Types.ObjectId;
  slmcRegistrationNo: string;
  specialization: string[];
  qualifications: IQualification[];
  experience?: number;
  bio?: string;
  languages: string[];
  consultationFee: number;
  followUpFee?: number;
  availability: IAvailability[];
  blockedSlots: IBlockedSlot[];
  rating: IRating;
  totalConsultations: number;
  verificationStatus: 'pending' | 'under_review' | 'verified' | 'rejected';
  verificationDocuments: IVerificationDocument[];
  verifiedAt?: Date;
  verifiedBy?: Types.ObjectId;
  hospital?: string;
  clinicAddress?: string;
  isOnline: boolean;
  lastActiveAt?: Date;
  bankDetails?: IBankDetails;
  totalEarnings: number;
  pendingWithdrawal: number;
  createdAt: Date;
  updatedAt: Date;
}

const qualificationSchema = new Schema(
  {
    degree: { type: String },
    institution: { type: String },
    year: { type: Number },
  },
  { _id: false }
);

const availabilitySchema = new Schema(
  {
    dayOfWeek: { type: Number, min: 0, max: 6 },
    startTime: { type: String },
    endTime: { type: String },
    slotDuration: { type: Number, default: 30 },
    isActive: { type: Boolean, default: true },
  },
  { _id: false }
);

const blockedSlotSchema = new Schema(
  {
    date: { type: Date },
    startTime: { type: String },
    endTime: { type: String },
    reason: { type: String },
  },
  { _id: false }
);

const verificationDocumentSchema = new Schema(
  {
    type: { type: String },
    url: { type: String },
    uploadedAt: { type: Date },
  },
  { _id: false }
);

const bankDetailsSchema = new Schema(
  {
    bankName: { type: String },
    branchName: { type: String },
    accountNo: { type: String },
    accountName: { type: String },
  },
  { _id: false }
);

const doctorSchema = new Schema<IDoctor>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    slmcRegistrationNo: {
      type: String,
      required: true,
      unique: true,
    },
    specialization: [{ type: String, required: true }],
    qualifications: [qualificationSchema],
    experience: { type: Number },
    bio: { type: String, maxlength: 500 },
    languages: [{ type: String, enum: ['en', 'si', 'ta'] }],
    consultationFee: { type: Number, required: true },
    followUpFee: { type: Number },
    availability: [availabilitySchema],
    blockedSlots: [blockedSlotSchema],
    rating: {
      average: { type: Number, default: 0 },
      count: { type: Number, default: 0 },
    },
    totalConsultations: { type: Number, default: 0 },
    verificationStatus: {
      type: String,
      enum: ['pending', 'under_review', 'verified', 'rejected'],
      default: 'pending',
    },
    verificationDocuments: [verificationDocumentSchema],
    verifiedAt: { type: Date },
    verifiedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    hospital: { type: String },
    clinicAddress: { type: String },
    isOnline: { type: Boolean, default: false },
    lastActiveAt: { type: Date },
    bankDetails: { type: bankDetailsSchema },
    totalEarnings: { type: Number, default: 0 },
    pendingWithdrawal: { type: Number, default: 0 },
  },
  { timestamps: true }
);

doctorSchema.index({ userId: 1 });
doctorSchema.index({ verificationStatus: 1 });
doctorSchema.index({ specialization: 1 });

const Doctor = mongoose.model<IDoctor>('Doctor', doctorSchema);

export default Doctor;
