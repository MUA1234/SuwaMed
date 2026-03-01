import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IMessage extends Document {
  consultationId: Types.ObjectId;
  senderId: Types.ObjectId;
  receiverId: Types.ObjectId;
  type: 'text' | 'image' | 'file' | 'system';
  content?: string;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  isRead: boolean;
  readAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const messageSchema = new Schema<IMessage>(
  {
    consultationId: {
      type: Schema.Types.ObjectId,
      ref: 'Appointment',
      required: true,
    },
    senderId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    receiverId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: ['text', 'image', 'file', 'system'],
      required: true,
    },
    content: { type: String },
    fileUrl: { type: String },
    fileName: { type: String },
    fileSize: { type: Number },
    isRead: { type: Boolean, default: false },
    readAt: { type: Date },
  },
  { timestamps: true }
);

messageSchema.index({ consultationId: 1 });
messageSchema.index({ senderId: 1 });

const Message = mongoose.model<IMessage>('Message', messageSchema);

export default Message;
