import mongoose, { Schema, Document } from 'mongoose';

export interface ISlmcQualification {
  degree: string;
  institution: string;
  year: number;
}

export interface ISlmcRegistry extends Document {
  slmcNo: string;
  firstName: string;
  lastName: string;
  specialization: string[];
  qualifications: ISlmcQualification[];
  experience: number;
  hospital: string;
  consultationFee: number;
  isUsed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const slmcQualificationSchema = new Schema(
  {
    degree: { type: String, required: true },
    institution: { type: String, required: true },
    year: { type: Number, required: true },
  },
  { _id: false }
);

const slmcRegistrySchema = new Schema<ISlmcRegistry>(
  {
    slmcNo: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    specialization: [{ type: String, required: true }],
    qualifications: [slmcQualificationSchema],
    experience: { type: Number, required: true },
    hospital: { type: String, required: true },
    consultationFee: { type: Number, required: true },
    isUsed: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const SlmcRegistry = mongoose.model<ISlmcRegistry>('SlmcRegistry', slmcRegistrySchema);

export default SlmcRegistry;
