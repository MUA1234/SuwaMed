import admin from 'firebase-admin';
import Notification, { INotification } from '../models/Notification.model';
import User from '../models/User.model';
import logger from '../utils/logger';
import { Types } from 'mongoose';

// `firebase.ts` initialises the default admin app at import time. We import it
// for its side effects only, so that admin.messaging() works below — and we
// guard messaging() inside a try/catch in case the SDK refused to initialise
// (e.g. missing service-account env vars in local dev).
import '../config/firebase';

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

const EXPO_PUSH_ENDPOINT = 'https://exp.host/--/api/v2/push/send';

function isExpoPushToken(token: string): boolean {
  return token.startsWith('ExponentPushToken[') || token.startsWith('ExpoPushToken[');
}

// ---------------------------------------------------------------------------
// FCM dispatch via Firebase Admin Messaging
// ---------------------------------------------------------------------------

async function dispatchFcm(
  tokens: string[],
  payload: NotificationPayload,
): Promise<string[]> {
  if (tokens.length === 0) return [];
  // Mongoose / Firebase data must be string-valued — FCM rejects nested objects
  // in `data`. Stringify everything we care about.
  const dataStrings: Record<string, string> = {
    type: payload.type,
  };
  if (payload.data) {
    for (const [k, v] of Object.entries(payload.data)) {
      dataStrings[k] = typeof v === 'string' ? v : JSON.stringify(v);
    }
  }
  let messaging: admin.messaging.Messaging;
  try {
    messaging = admin.messaging();
  } catch (err) {
    logger.warn(`[notification] firebase admin messaging unavailable: ${(err as Error).message}`);
    return [];
  }
  const message: admin.messaging.MulticastMessage = {
    tokens,
    notification: { title: payload.title, body: payload.body },
    data: dataStrings,
    android: { priority: 'high', notification: { channelId: 'default' } },
    apns: { payload: { aps: { sound: 'default' } } },
  };
  try {
    const response = await messaging.sendEachForMulticast(message);
    const invalid: string[] = [];
    response.responses.forEach((r, i) => {
      if (!r.success && r.error) {
        const code = r.error.code;
        if (
          code === 'messaging/registration-token-not-registered' ||
          code === 'messaging/invalid-registration-token' ||
          code === 'messaging/invalid-argument'
        ) {
          invalid.push(tokens[i]);
        } else {
          logger.warn(`[notification] FCM send error for token ${tokens[i].slice(0, 12)}…: ${code}`);
        }
      }
    });
    return invalid;
  } catch (err) {
    logger.error(`[notification] FCM multicast failed: ${(err as Error).message}`);
    return [];
  }
}

// ---------------------------------------------------------------------------
// Expo Push dispatch
// ---------------------------------------------------------------------------

interface ExpoTicket {
  status: 'ok' | 'error';
  id?: string;
  message?: string;
  details?: { error?: string };
}

async function dispatchExpo(
  tokens: string[],
  payload: NotificationPayload,
): Promise<string[]> {
  if (tokens.length === 0) return [];
  const messages = tokens.map((to) => ({
    to,
    sound: 'default',
    title: payload.title,
    body: payload.body,
    data: { type: payload.type, ...(payload.data ?? {}) },
    channelId: 'default',
    priority: 'high' as const,
  }));
  try {
    const res = await fetch(EXPO_PUSH_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'Accept-Encoding': 'gzip, deflate',
      },
      body: JSON.stringify(messages),
    });
    if (!res.ok) {
      logger.warn(`[notification] Expo push HTTP ${res.status}`);
      return [];
    }
    const json = (await res.json()) as { data?: ExpoTicket[] };
    const tickets = json.data ?? [];
    const invalid: string[] = [];
    tickets.forEach((t, i) => {
      if (t.status === 'error') {
        const err = t.details?.error;
        if (err === 'DeviceNotRegistered' || err === 'InvalidCredentials') {
          invalid.push(tokens[i]);
        } else {
          logger.warn(`[notification] Expo push ticket error for ${tokens[i].slice(0, 16)}…: ${err ?? t.message}`);
        }
      }
    });
    return invalid;
  } catch (err) {
    logger.error(`[notification] Expo push dispatch failed: ${(err as Error).message}`);
    return [];
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function sendToUser(payload: NotificationPayload): Promise<INotification | null> {
  // 1. Persist the durable in-app notification first. The inbox and unread
  //    badge come from this collection, so we never want push failure to mask
  //    a successful state change.
  let doc: INotification | null = null;
  try {
    doc = await Notification.create({
      userId: payload.userId,
      type: payload.type,
      title: payload.title,
      body: payload.body,
      data: payload.data ?? {},
      isRead: false,
    });
  } catch (err) {
    logger.error(`[notification] failed to persist notification for ${payload.userId}: ${(err as Error).message}`);
  }

  // 2. Look up the user's push tokens and fan out.
  try {
    const user = await User.findById(payload.userId).select('fcmTokens').lean();
    const tokens = user?.fcmTokens ?? [];
    if (tokens.length === 0) return doc;

    const expoTokens = tokens.filter(isExpoPushToken);
    const fcmTokens = tokens.filter((t) => !isExpoPushToken(t));

    const [expoInvalid, fcmInvalid] = await Promise.all([
      dispatchExpo(expoTokens, payload),
      dispatchFcm(fcmTokens, payload),
    ]);

    const invalid = [...expoInvalid, ...fcmInvalid];
    if (invalid.length > 0) {
      await User.updateOne(
        { _id: payload.userId },
        { $pull: { fcmTokens: { $in: invalid } } },
      );
      logger.info(`[notification] pruned ${invalid.length} stale push token(s) for ${payload.userId}`);
    }
  } catch (err) {
    logger.error(`[notification] dispatch failed for ${payload.userId}: ${(err as Error).message}`);
  }

  return doc;
}

export async function sendToUsers(
  userIds: Array<string | Types.ObjectId>,
  payload: Omit<NotificationPayload, 'userId'>,
): Promise<number> {
  if (userIds.length === 0) return 0;
  // Loop is intentional — each user has their own token list and prune step.
  // Volume here is small (e.g. one patient + one doctor); no need to batch.
  let count = 0;
  for (const userId of userIds) {
    const doc = await sendToUser({ userId, ...payload });
    if (doc) count += 1;
  }
  return count;
}
