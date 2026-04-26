import { User } from './auth.types';

export interface Doctor {
  _id: string;
  userId: string | User;
  slmcRegistrationNo: string;
  specialization: string[];
  qualifications: Qualification[];
  experience: number;
  bio?: string;
  languages: ('en' | 'si' | 'ta')[];
  consultationFee: number;
  followUpFee?: number;
  availability: AvailabilitySlot[];
  blockedSlots: BlockedSlot[];
  rating: { average: number; count: number };
  totalConsultations: number;
  verificationStatus: 'pending' | 'under_review' | 'verified' | 'rejected';
  hospital?: string;
  clinicAddress?: string;
  isOnline: boolean;
  lastActiveAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Qualification {
  degree: string;
  institution: string;
  year: number;
}

export interface AvailabilitySlot {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  slotDuration: number;
  isActive: boolean;
}

export interface BlockedSlot {
  date: string;
  startTime: string;
  endTime: string;
  reason?: string;
}
