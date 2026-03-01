import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IHealthTip extends Document {
  title: string;
  content: string;
  category:
    | 'nutrition'
    | 'exercise'
    | 'mental_health'
    | 'disease_prevention'
    | 'first_aid'
    | 'maternal_health'
    | 'child_health'
    | 'elderly_care';
  coverImage?: string;
  author?: Types.ObjectId;
  language: 'en' | 'si' | 'ta';
  tags: string[];
  isPublished: boolean;
  publishedAt?: Date;
  viewCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const healthTipSchema = new Schema<IHealthTip>(
  {
    title: { type: String, required: true },
    content: { type: String, required: true },
    category: {
      type: String,
      enum: [
        'nutrition',
        'exercise',
        'mental_health',
        'disease_prevention',
        'first_aid',
        'maternal_health',
        'child_health',
        'elderly_care',
      ],
      required: true,
    },
    coverImage: { type: String },
    author: { type: Schema.Types.ObjectId, ref: 'User' },
    language: {
      type: String,
      enum: ['en', 'si', 'ta'],
      default: 'en',
    },
    tags: [{ type: String }],
    isPublished: { type: Boolean, default: false },
    publishedAt: { type: Date },
    viewCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const HealthTip = mongoose.model<IHealthTip>('HealthTip', healthTipSchema);

export default HealthTip;
