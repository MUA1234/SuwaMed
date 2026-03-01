import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IReviewResponse {
  text?: string;
  respondedAt?: Date;
}

export interface IReview extends Document {
  appointmentId: Types.ObjectId;
  patientId: Types.ObjectId;
  doctorId: Types.ObjectId;
  rating: number;
  comment?: string;
  isAnonymous: boolean;
  response: IReviewResponse;
  createdAt: Date;
  updatedAt: Date;
}

const reviewSchema = new Schema<IReview>(
  {
    appointmentId: {
      type: Schema.Types.ObjectId,
      ref: 'Appointment',
      required: true,
    },
    patientId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    doctorId: {
      type: Schema.Types.ObjectId,
      ref: 'Doctor',
      required: true,
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      required: true,
    },
    comment: { type: String, maxlength: 500 },
    isAnonymous: { type: Boolean, default: false },
    response: {
      text: { type: String },
      respondedAt: { type: Date },
    },
  },
  { timestamps: true }
);

const Review = mongoose.model<IReview>('Review', reviewSchema);

export default Review;
