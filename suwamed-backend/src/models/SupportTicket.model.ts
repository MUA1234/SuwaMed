import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ITicketMessage {
  senderId: Types.ObjectId;
  message: string;
  attachments: string[];
  sentAt: Date;
}

export interface ISupportTicket extends Document {
  userId: Types.ObjectId;
  subject: string;
  description: string;
  category: 'technical' | 'payment' | 'account' | 'consultation' | 'other';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  messages: ITicketMessage[];
  assignedTo?: Types.ObjectId;
  resolvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ticketMessageSchema = new Schema(
  {
    senderId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    message: { type: String, required: true },
    attachments: [{ type: String }],
    sentAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const supportTicketSchema = new Schema<ISupportTicket>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    subject: { type: String, required: true },
    description: { type: String, required: true },
    category: {
      type: String,
      enum: ['technical', 'payment', 'account', 'consultation', 'other'],
      required: true,
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
    },
    status: {
      type: String,
      enum: ['open', 'in_progress', 'resolved', 'closed'],
      default: 'open',
    },
    messages: [ticketMessageSchema],
    assignedTo: { type: Schema.Types.ObjectId, ref: 'User' },
    resolvedAt: { type: Date },
  },
  { timestamps: true }
);

const SupportTicket = mongoose.model<ISupportTicket>(
  'SupportTicket',
  supportTicketSchema
);

export default SupportTicket;
