import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ISystemLog extends Document {
  userId?: Types.ObjectId;
  action: string;
  details?: any;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
  updatedAt: Date;
}

const systemLogSchema = new Schema<ISystemLog>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    action: { type: String, required: true },
    details: { type: Schema.Types.Mixed },
    ipAddress: { type: String },
    userAgent: { type: String },
  },
  { timestamps: true }
);

systemLogSchema.index({ userId: 1 });
systemLogSchema.index({ action: 1 });

const SystemLog = mongoose.model<ISystemLog>('SystemLog', systemLogSchema);

export default SystemLog;
