import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IEmergencyContact {
  name?: string;
  phone?: string;
  relationship?: string;
}

export interface ISubscription {
  plan: 'free' | 'basic' | 'premium';
  startDate?: Date;
  endDate?: Date;
  isActive: boolean;
  autoRenew: boolean;
}

export interface IPatient extends Document {
  userId: Types.ObjectId;
  bloodGroup?: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';
  height?: number;
  weight?: number;
  allergies: string[];
  chronicConditions: string[];
  emergencyContact?: IEmergencyContact;
  subscription: ISubscription;
  createdAt: Date;
  updatedAt: Date;
}

const emergencyContactSchema = new Schema(
  {
    name: { type: String },
    phone: { type: String },
    relationship: { type: String },
  },
  { _id: false }
);

const subscriptionSchema = new Schema(
  {
    plan: {
      type: String,
      enum: ['free', 'basic', 'premium'],
      default: 'free',
    },
    startDate: { type: Date },
    endDate: { type: Date },
    isActive: { type: Boolean, default: true },
    autoRenew: { type: Boolean, default: false },
  },
  { _id: false }
);

const patientSchema = new Schema<IPatient>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    bloodGroup: {
      type: String,
      enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
    },
    height: { type: Number },
    weight: { type: Number },
    allergies: [{ type: String }],
    chronicConditions: [{ type: String }],
    emergencyContact: { type: emergencyContactSchema },
    subscription: {
      type: subscriptionSchema,
      default: () => ({}),
    },
  },
  { timestamps: true }
);

const Patient = mongoose.model<IPatient>('Patient', patientSchema);

export default Patient;
