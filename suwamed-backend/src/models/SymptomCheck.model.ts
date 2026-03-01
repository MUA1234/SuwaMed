import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ISymptom {
  name: string;
  severity: 'mild' | 'moderate' | 'severe';
  duration?: string;
  bodyPart?: string;
}

export interface IPossibleCondition {
  name: string;
  probability?: number;
  description?: string;
}

export interface IAiResponse {
  possibleConditions: IPossibleCondition[];
  recommendation?: 'self_care' | 'consult_doctor' | 'emergency';
  selfCareAdvice?: string;
  suggestedSpecializations: string[];
  disclaimer?: string;
}

export interface IAdditionalInfo {
  age?: number;
  gender?: string;
  existingConditions: string[];
  currentMedications: string[];
}

export interface ISymptomCheck extends Document {
  patientId: Types.ObjectId;
  symptoms: ISymptom[];
  additionalInfo: IAdditionalInfo;
  aiResponse: IAiResponse;
  language: 'en' | 'si' | 'ta';
  createdAt: Date;
  updatedAt: Date;
}

const symptomSchema = new Schema(
  {
    name: { type: String, required: true },
    severity: {
      type: String,
      enum: ['mild', 'moderate', 'severe'],
      required: true,
    },
    duration: { type: String },
    bodyPart: { type: String },
  },
  { _id: false }
);

const possibleConditionSchema = new Schema(
  {
    name: { type: String, required: true },
    probability: { type: Number },
    description: { type: String },
  },
  { _id: false }
);

const aiResponseSchema = new Schema(
  {
    possibleConditions: [possibleConditionSchema],
    recommendation: {
      type: String,
      enum: ['self_care', 'consult_doctor', 'emergency'],
    },
    selfCareAdvice: { type: String },
    suggestedSpecializations: [{ type: String }],
    disclaimer: { type: String },
  },
  { _id: false }
);

const additionalInfoSchema = new Schema(
  {
    age: { type: Number },
    gender: { type: String },
    existingConditions: [{ type: String }],
    currentMedications: [{ type: String }],
  },
  { _id: false }
);

const symptomCheckSchema = new Schema<ISymptomCheck>(
  {
    patientId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    symptoms: [symptomSchema],
    additionalInfo: { type: additionalInfoSchema },
    aiResponse: { type: aiResponseSchema },
    language: {
      type: String,
      enum: ['en', 'si', 'ta'],
      default: 'en',
    },
  },
  { timestamps: true }
);

const SymptomCheck = mongoose.model<ISymptomCheck>(
  'SymptomCheck',
  symptomCheckSchema
);

export default SymptomCheck;
