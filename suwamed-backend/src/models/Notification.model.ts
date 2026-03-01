import mongoose, { Schema, Document, Types } from 'mongoose';

export interface INotification extends Document {
  userId: Types.ObjectId;
  type:
    | 'appointment_reminder'
    | 'appointment_confirmed'
    | 'appointment_cancelled'
    | 'consultation_started'
    | 'prescription_ready'
    | 'payment_received'
    | 'payment_failed'
    | 'review_request'
    | 'doctor_verified'
    | 'doctor_rejected'
    | 'symptom_check_result'
    | 'health_tip'
    | 'subscription_expiring'
    | 'subscription_renewed'
    | 'support_reply'
    | 'general';
  title: string;
  body: string;
  data?: any;
  isRead: boolean;
  readAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: [
        'appointment_reminder',
        'appointment_confirmed',
        'appointment_cancelled',
        'consultation_started',
        'prescription_ready',
        'payment_received',
        'payment_failed',
        'review_request',
        'doctor_verified',
        'doctor_rejected',
        'symptom_check_result',
        'health_tip',
        'subscription_expiring',
        'subscription_renewed',
        'support_reply',
        'general',
      ],
      required: true,
    },
    title: { type: String, required: true },
    body: { type: String, required: true },
    data: { type: Schema.Types.Mixed },
    isRead: { type: Boolean, default: false },
    readAt: { type: Date },
  },
  { timestamps: true }
);

notificationSchema.index({ userId: 1 });
notificationSchema.index({ isRead: 1 });

const Notification = mongoose.model<INotification>(
  'Notification',
  notificationSchema
);

export default Notification;
