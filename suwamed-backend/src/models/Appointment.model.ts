import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IPaymentSubdoc {
  amount: number;
  status: string;
  transactionId?: string;
  paidAt?: Date;
}

export interface IConsultationSubdoc {
  startedAt?: Date;
  endedAt?: Date;
  duration?: number;
  agoraChannelName?: string;
  recordingUrl?: string;
}

export interface IAppointment extends Document {
  patientId: Types.ObjectId;
  doctorId: Types.ObjectId;
  date: Date;
  startTime: string;
  endTime: string;
  type: 'video' | 'chat' | 'follow_up';
  status:
    | 'pending'
    | 'confirmed'
    | 'in_progress'
    | 'completed'
    | 'cancelled'
    | 'no_show';
  reason?: string;
  symptoms: string[];
  notes?: string;
  prescription?: Types.ObjectId;
  payment: IPaymentSubdoc;
  consultation: IConsultationSubdoc;
  cancelledBy?: Types.ObjectId;
  cancelReason?: string;
  review?: Types.ObjectId;
  reminderSent: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const paymentSubdocSchema = new Schema(
  {
    amount: { type: Number },
    status: { type: String },
    transactionId: { type: String },
    paidAt: { type: Date },
  },
  { _id: false }
);

const consultationSubdocSchema = new Schema(
  {
    startedAt: { type: Date },
    endedAt: { type: Date },
    duration: { type: Number },
    agoraChannelName: { type: String },
    recordingUrl: { type: String },
  },
  { _id: false }
);

const appointmentSchema = new Schema<IAppointment>(
  {
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
    date: { type: Date, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    type: {
      type: String,
      enum: ['video', 'chat', 'follow_up'],
      required: true,
    },
    status: {
      type: String,
      enum: [
        'pending',
        'confirmed',
        'in_progress',
        'completed',
        'cancelled',
        'no_show',
      ],
      default: 'pending',
    },
    reason: { type: String },
    symptoms: [{ type: String }],
    notes: { type: String },
    prescription: { type: Schema.Types.ObjectId, ref: 'Prescription' },
    payment: { type: paymentSubdocSchema },
    consultation: { type: consultationSubdocSchema },
    cancelledBy: { type: Schema.Types.ObjectId, ref: 'User' },
    cancelReason: { type: String },
    review: { type: Schema.Types.ObjectId, ref: 'Review' },
    reminderSent: { type: Boolean, default: false },
  },
  { timestamps: true }
);

appointmentSchema.index({ patientId: 1 });
appointmentSchema.index({ doctorId: 1 });
appointmentSchema.index({ date: 1 });
appointmentSchema.index({ status: 1 });

const Appointment = mongoose.model<IAppointment>(
  'Appointment',
  appointmentSchema
);

export default Appointment;
