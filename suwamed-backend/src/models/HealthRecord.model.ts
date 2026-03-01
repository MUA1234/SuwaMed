import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IHealthRecord extends Document {
  patientId: Types.ObjectId;
  title: string;
  category:
    | 'lab_report'
    | 'prescription'
    | 'imaging'
    | 'vaccination'
    | 'discharge_summary'
    | 'other';
  description?: string;
  fileUrl?: string;
  fileType?: string;
  fileSize?: number;
  date?: Date;
  doctor?: string;
  hospital?: string;
  tags: string[];
  isSharedWithDoctor: boolean;
  sharedWith: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const healthRecordSchema = new Schema<IHealthRecord>(
  {
    patientId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: { type: String, required: true },
    category: {
      type: String,
      enum: [
        'lab_report',
        'prescription',
        'imaging',
        'vaccination',
        'discharge_summary',
        'other',
      ],
      required: true,
    },
    description: { type: String },
    fileUrl: { type: String },
    fileType: { type: String },
    fileSize: { type: Number },
    date: { type: Date },
    doctor: { type: String },
    hospital: { type: String },
    tags: [{ type: String }],
    isSharedWithDoctor: { type: Boolean, default: false },
    sharedWith: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true }
);

const HealthRecord = mongoose.model<IHealthRecord>(
  'HealthRecord',
  healthRecordSchema
);

export default HealthRecord;
