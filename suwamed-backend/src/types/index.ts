import { Document, Types } from 'mongoose';

export interface IUser extends Document {
  _id: Types.ObjectId;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone: string;
  role: 'patient' | 'doctor' | 'admin';
  profileImage?: string;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  isActive: boolean;
  otp?: string;
  otpExpiry?: Date;
  refreshToken?: string;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IDoctor extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  slmcRegistrationNumber: string;
  specialization: string;
  qualifications: string[];
  experience: number;
  bio?: string;
  consultationFee: number;
  availableSlots: {
    day: string;
    startTime: string;
    endTime: string;
  }[];
  hospital?: string;
  district: string;
  verificationStatus: 'pending' | 'under_review' | 'verified' | 'rejected';
  verificationDocuments: string[];
  rating: number;
  totalReviews: number;
  totalConsultations: number;
  isAvailable: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IPatient extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  dateOfBirth?: Date;
  gender?: 'male' | 'female' | 'other';
  bloodGroup?: string;
  height?: number;
  weight?: number;
  allergies: string[];
  chronicConditions: string[];
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  district?: string;
  address?: string;
  subscriptionPlan: 'free' | 'basic' | 'premium';
  subscriptionExpiry?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IAppointment extends Document {
  _id: Types.ObjectId;
  patientId: Types.ObjectId;
  doctorId: Types.ObjectId;
  scheduledDate: Date;
  scheduledTime: string;
  duration: number;
  consultationType: 'video' | 'chat' | 'follow_up';
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
  symptoms?: string;
  notes?: string;
  prescription?: Types.ObjectId;
  paymentId?: Types.ObjectId;
  meetingLink?: string;
  cancelledBy?: Types.ObjectId;
  cancellationReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IMessage extends Document {
  _id: Types.ObjectId;
  appointmentId: Types.ObjectId;
  senderId: Types.ObjectId;
  receiverId: Types.ObjectId;
  content: string;
  messageType: 'text' | 'image' | 'file' | 'system';
  fileUrl?: string;
  isRead: boolean;
  readAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IHealthRecord extends Document {
  _id: Types.ObjectId;
  patientId: Types.ObjectId;
  doctorId: Types.ObjectId;
  appointmentId?: Types.ObjectId;
  diagnosis: string;
  symptoms: string[];
  treatmentPlan?: string;
  notes?: string;
  attachments: string[];
  vitalSigns?: {
    bloodPressure?: string;
    heartRate?: number;
    temperature?: number;
    weight?: number;
    bloodSugar?: number;
  };
  followUpDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IPrescription extends Document {
  _id: Types.ObjectId;
  appointmentId: Types.ObjectId;
  patientId: Types.ObjectId;
  doctorId: Types.ObjectId;
  medications: {
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
    instructions?: string;
  }[];
  additionalNotes?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ISubscription extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  plan: 'free' | 'basic' | 'premium';
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  paymentId?: Types.ObjectId;
  features: string[];
  autoRenew: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IPayment extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  appointmentId?: Types.ObjectId;
  subscriptionId?: Types.ObjectId;
  amount: number;
  currency: string;
  paymentMethod: string;
  transactionId?: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IReview extends Document {
  _id: Types.ObjectId;
  patientId: Types.ObjectId;
  doctorId: Types.ObjectId;
  appointmentId: Types.ObjectId;
  rating: number;
  comment?: string;
  isAnonymous: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ISymptomCheck extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  symptoms: string[];
  additionalInfo?: string;
  aiResponse: {
    possibleConditions: {
      name: string;
      probability: string;
      description: string;
    }[];
    recommendation: string;
    urgencyLevel: 'low' | 'medium' | 'high' | 'emergency';
    suggestedSpecialization?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface INotification extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  title: string;
  message: string;
  type: 'appointment' | 'payment' | 'system' | 'promotion' | 'reminder';
  isRead: boolean;
  readAt?: Date;
  data?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface IHealthTip extends Document {
  _id: Types.ObjectId;
  title: string;
  content: string;
  category: string;
  imageUrl?: string;
  author?: Types.ObjectId;
  tags: string[];
  isPublished: boolean;
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ISupportTicket extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  subject: string;
  description: string;
  category: 'technical' | 'billing' | 'general' | 'complaint';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high';
  responses: {
    responderId: Types.ObjectId;
    message: string;
    createdAt: Date;
  }[];
  attachments: string[];
  createdAt: Date;
  updatedAt: Date;
}
