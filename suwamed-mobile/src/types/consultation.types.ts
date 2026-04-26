export interface Message {
  _id: string;
  consultationId: string;
  senderId: string;
  receiverId: string;
  type: 'text' | 'image' | 'file' | 'system';
  content: string;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
}
