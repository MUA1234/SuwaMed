import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IPayment extends Document {
  userId: Types.ObjectId;
  type: 'consultation' | 'subscription' | 'withdrawal';
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  gateway: 'payhere' | 'card' | 'bank_transfer' | 'cash';
  transactionId?: string;
  gatewayResponse?: any;
  appointmentId?: Types.ObjectId;
  subscriptionId?: Types.ObjectId;
  refundAmount?: number;
  refundReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const paymentSchema = new Schema<IPayment>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: ['consultation', 'subscription', 'withdrawal'],
      required: true,
    },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'LKR' },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded'],
      default: 'pending',
    },
    gateway: {
      type: String,
      enum: ['payhere', 'card', 'bank_transfer', 'cash'],
    },
    transactionId: { type: String },
    gatewayResponse: { type: Schema.Types.Mixed },
    appointmentId: { type: Schema.Types.ObjectId, ref: 'Appointment' },
    subscriptionId: { type: Schema.Types.ObjectId, ref: 'Subscription' },
    refundAmount: { type: Number },
    refundReason: { type: String },
  },
  { timestamps: true }
);

paymentSchema.index({ userId: 1 });
paymentSchema.index({ status: 1 });

const Payment = mongoose.model<IPayment>('Payment', paymentSchema);

export default Payment;
