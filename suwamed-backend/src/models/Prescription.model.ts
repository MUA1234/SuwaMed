import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IMedication {
  name: string;
  dosage?: string;
  frequency?: string;
  duration?: string;
  instructions?: string;
  quantity?: number;
}

export interface IPrescription extends Document {
  appointmentId: Types.ObjectId;
  doctorId: Types.ObjectId;
  patientId: Types.ObjectId;
  diagnosis?: string;
  medications: IMedication[];
  additionalNotes?: string;
  followUpDate?: Date;
  followUpInstructions?: string;
  digitalSignature?: string;
  issuedAt?: Date;
  pdfUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const medicationSchema = new Schema(
  {
    name: { type: String, required: true },
    dosage: { type: String },
    frequency: { type: String },
    duration: { type: String },
    instructions: { type: String },
    quantity: { type: Number },
  },
  { _id: false }
);

const prescriptionSchema = new Schema<IPrescription>(
  {
    appointmentId: {
      type: Schema.Types.ObjectId,
      ref: 'Appointment',
      required: true,
    },
    doctorId: {
      type: Schema.Types.ObjectId,
      ref: 'Doctor',
      required: true,
    },
    patientId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    diagnosis: { type: String },
    medications: [medicationSchema],
    additionalNotes: { type: String },
    followUpDate: { type: Date },
    followUpInstructions: { type: String },
    digitalSignature: { type: String },
    issuedAt: { type: Date },
    pdfUrl: { type: String },
  },
  { timestamps: true }
);

const Prescription = mongoose.model<IPrescription>(
  'Prescription',
  prescriptionSchema
);

export default Prescription;
