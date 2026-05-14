import Notification, { INotification } from '../models/Notification.model';
import logger from '../utils/logger';
import { Types } from 'mongoose';

// Type union mirrors Notification.model.ts. Keeping it inline avoids a circular
// import when notification.service is consumed by code that also persists the
// document directly (e.g. controllers that create system notifications).
export type NotificationType =
  | 'appointment_reminder'
  | 'appointment_confirmed'
  | 'appointment_cancelled'
  | 'consultation_started'
  | 'prescription_ready'
  | 'payment_received'
  | 'payment_failed'
  | 'review_request'
  | 'doctor_verified'
  | 'doctor_rejected'
  | 'symptom_check_result'
  | 'health_tip'
  | 'subscription_expiring'
  | 'subscription_renewed'
  | 'support_reply'
  | 'general';

export interface NotificationPayload {
  userId: string | Types.ObjectId;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

// Send a notification to a single user.
//
// Today this only writes the durable Notification document — the in-app inbox
// (`/notifications` GET) and unread-badge counts read from this collection.
// Row 15 (FCM push) will extend `sendToUser` to also dispatch via Firebase
// Admin Messaging once the user has registered `fcmTokens`. Call sites added
// in this row do not need to change when that lands.
export async function sendToUser(payload: NotificationPayload): Promise<INotification | null> {
  try {
    const doc = await Notification.create({
      userId: payload.userId,
      type: payload.type,
      title: payload.title,
      body: payload.body,
      data: payload.data ?? {},
      isRead: false,
    });
    return doc;
  } catch (err) {
    logger.error(`[notification] failed to persist notification for ${payload.userId}: ${(err as Error).message}`);
    return null;
  }
}

// Send the same notification to multiple users (e.g. patient + doctor for an
// appointment reminder). Returns the count of successfully persisted rows.
export async function sendToUsers(
  userIds: Array<string | Types.ObjectId>,
  payload: Omit<NotificationPayload, 'userId'>,
): Promise<number> {
  if (userIds.length === 0) return 0;
  const docs = userIds.map((uid) => ({
    userId: uid,
    type: payload.type,
    title: payload.title,
    body: payload.body,
    data: payload.data ?? {},
    isRead: false,
  }));
  try {
    const result = await Notification.insertMany(docs, { ordered: false });
    return result.length;
  } catch (err) {
    logger.error(`[notification] bulk persist failed: ${(err as Error).message}`);
    return 0;
  }
}
