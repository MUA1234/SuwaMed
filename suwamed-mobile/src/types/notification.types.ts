export type NotificationType =
  | 'appointment_reminder' | 'appointment_confirmed' | 'appointment_cancelled'
  | 'consultation_started' | 'prescription_ready' | 'payment_received'
  | 'subscription_expiring' | 'doctor_verified' | 'review_received'
  | 'health_tip' | 'system' | 'medication_reminder';

export interface Notification {
  _id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: any;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
}
