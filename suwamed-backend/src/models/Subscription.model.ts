import mongoose, { Schema, Document } from 'mongoose';

export interface IFeature {
  name: string;
  limit?: number;
}

export interface ISubscriptionPlan extends Document {
  name: string;
  price: number;
  duration: number;
  features: IFeature[];
  maxConsultationsPerMonth?: number;
  maxSymptomChecksPerDay?: number;
  videoCallEnabled: boolean;
  healthRecordStorage?: number;
  priorityBooking: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const featureSchema = new Schema(
  {
    name: { type: String, required: true },
    limit: { type: Number },
  },
  { _id: false }
);

const subscriptionPlanSchema = new Schema<ISubscriptionPlan>(
  {
    name: { type: String, required: true },
    price: { type: Number, required: true },
    duration: { type: Number, required: true },
    features: [featureSchema],
    maxConsultationsPerMonth: { type: Number },
    maxSymptomChecksPerDay: { type: Number },
    videoCallEnabled: { type: Boolean, default: false },
    healthRecordStorage: { type: Number },
    priorityBooking: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const Subscription = mongoose.model<ISubscriptionPlan>(
  'Subscription',
  subscriptionPlanSchema
);

export default Subscription;
