export type ConsultationType = 'video' | 'chat' | 'follow_up';
export type AppointmentStatus = 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';

export interface Appointment {
  _id: string;
  patientId: string;
  doctorId: string | any;
  date: string;
  startTime: string;
  endTime: string;
  type: ConsultationType;
  status: AppointmentStatus;
  reason?: string;
  symptoms?: string[];
  notes?: string;
  prescription?: string;
  payment?: {
    amount: number;
    status: 'pending' | 'paid' | 'refunded' | 'failed';
    transactionId?: string;
    paidAt?: string;
  };
  consultation?: {
    startedAt?: string;
    endedAt?: string;
    duration?: number;
    agoraChannelName?: string;
  };
  cancelledBy?: string;
  cancelReason?: string;
  review?: string;
  createdAt: string;
  updatedAt: string;
}
