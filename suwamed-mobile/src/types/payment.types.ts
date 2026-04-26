export type PaymentType = 'consultation' | 'subscription' | 'withdrawal';
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';

export interface Payment {
  _id: string;
  userId: string;
  type: PaymentType;
  amount: number;
  currency: string;
  status: PaymentStatus;
  gateway: 'payhere' | 'card' | 'bank_transfer';
  transactionId?: string;
  appointmentId?: string;
  subscriptionId?: string;
  createdAt: string;
  updatedAt: string;
}
