import type { Server as HttpServer } from 'http';
import { Server as IoServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import Appointment from '../models/Appointment.model';
import Doctor from '../models/Doctor.model';
import Message from '../models/Message.model';
import logger from '../utils/logger';
import { sendToUser } from '../services/notification.service';

interface AuthPayload {
  id: string;
  role: 'patient' | 'doctor' | 'admin';
  email?: string;
}

type AuthedSocket = Socket & { user: AuthPayload };

let io: IoServer | null = null;

// Verify the JWT presented in `socket.handshake.auth.token` (matches the
// useSocket client which sends `auth: { token: accessToken }`).
function authenticate(socket: Socket, next: (err?: Error) => void): void {
  try {
    const token =
      (socket.handshake.auth?.token as string | undefined) ||
      (socket.handshake.headers?.authorization as string | undefined)?.replace(/^Bearer\s+/, '');
    if (!token) return next(new Error('Auth token missing'));
    const secret = process.env.JWT_SECRET;
    if (!secret) return next(new Error('JWT_SECRET not configured'));
    const decoded = jwt.verify(token, secret) as jwt.JwtPayload;
    if (!decoded?.id || !decoded?.role) return next(new Error('Invalid token payload'));
    (socket as AuthedSocket).user = {
      id: String(decoded.id),
      role: decoded.role as AuthPayload['role'],
      email: decoded.email as string | undefined,
    };
    return next();
  } catch (err) {
    logger.warn(`[socket] auth rejected: ${(err as Error).message}`);
    return next(new Error('Auth failed'));
  }
}

// Return true if `user` is allowed to participate in the chat for this
// appointment. Patients must own the appointment; doctors must own the
// matching Doctor profile. Admins bypass for moderation tooling.
async function userBelongsToAppointment(appointmentId: string, user: AuthPayload): Promise<boolean> {
  const appt = await Appointment.findById(appointmentId).select('patientId doctorId').lean();
  if (!appt) return false;
  if (user.role === 'admin') return true;
  if (user.role === 'patient' && String(appt.patientId) === user.id) return true;
  if (user.role === 'doctor') {
    const doc = await Doctor.findOne({ userId: user.id }).select('_id').lean();
    if (doc && String(appt.doctorId) === String(doc._id)) return true;
  }
  return false;
}

async function resolveCounterpartyUserId(
  appointmentId: string,
  selfUserId: string,
): Promise<string | null> {
  const appt = await Appointment.findById(appointmentId)
    .populate({ path: 'doctorId', select: 'userId' })
    .select('patientId doctorId')
    .lean();
  if (!appt) return null;
  const doctorUserId = (appt.doctorId as unknown as { userId?: unknown } | null)?.userId;
  if (String(appt.patientId) === selfUserId) {
    return doctorUserId ? String(doctorUserId) : null;
  }
  return String(appt.patientId);
}

export function getIO(): IoServer {
  if (!io) throw new Error('Socket.io not initialised — call initSocket(server) first');
  return io;
}

export function initSocket(server: HttpServer): IoServer {
  if (io) return io;

  // Native mobile clients have no Origin header; the existing CORS config in
  // server.ts already handles browser-origin lockdown for REST. We mirror it
  // here so the websocket upgrade succeeds in both environments.
  const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
  const allowAll = allowedOrigins.includes('*');

  io = new IoServer(server, {
    cors: {
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (allowAll) return callback(null, true);
        if (allowedOrigins.includes(origin)) return callback(null, true);
        return callback(new Error(`CORS: socket origin ${origin} not allowed`), false);
      },
      credentials: true,
    },
    pingTimeout: 30_000,
    pingInterval: 25_000,
  });

  io.use(authenticate);

  io.on('connection', (raw) => {
    const socket = raw as AuthedSocket;
    logger.info(`[socket] connected user=${socket.user.id} role=${socket.user.role} sid=${socket.id}`);

    // Personal room — used by the notification fan-out (future) and by the
    // counterparty when they emit "join_consultation" so we can push them a
    // new_message even if their consultation room subscription dropped.
    socket.join(`user:${socket.user.id}`);

    socket.on('join_consultation', async (appointmentId: string, ack?: (res: unknown) => void) => {
      try {
        if (typeof appointmentId !== 'string' || !appointmentId) {
          ack?.({ ok: false, error: 'appointmentId required' });
          return;
        }
        const ok = await userBelongsToAppointment(appointmentId, socket.user);
        if (!ok) {
          ack?.({ ok: false, error: 'not authorised for this consultation' });
          return;
        }
        socket.join(`consultation:${appointmentId}`);
        ack?.({ ok: true });
      } catch (err) {
        logger.error(`[socket] join_consultation: ${(err as Error).message}`);
        ack?.({ ok: false, error: 'internal error' });
      }
    });

    socket.on('leave_consultation', (appointmentId: string) => {
      if (typeof appointmentId === 'string' && appointmentId) {
        socket.leave(`consultation:${appointmentId}`);
      }
    });

    socket.on(
      'send_message',
      async (
        data: { consultationId?: string; content?: string; type?: string; fileUrl?: string; fileName?: string; fileSize?: number },
        ack?: (res: unknown) => void,
      ) => {
        try {
          const consultationId = String(data?.consultationId || '');
          const content = typeof data?.content === 'string' ? data.content : '';
          const type = (data?.type as 'text' | 'image' | 'file') || 'text';
          if (!consultationId) return ack?.({ ok: false, error: 'consultationId required' });
          if (!['text', 'image', 'file'].includes(type)) return ack?.({ ok: false, error: 'invalid type' });
          if (type === 'text' && content.trim().length === 0) return ack?.({ ok: false, error: 'empty message' });
          if (content.length > 4000) return ack?.({ ok: false, error: 'message too long' });

          const ok = await userBelongsToAppointment(consultationId, socket.user);
          if (!ok) return ack?.({ ok: false, error: 'not authorised' });

          const receiverId = await resolveCounterpartyUserId(consultationId, socket.user.id);
          if (!receiverId) return ack?.({ ok: false, error: 'counterparty not found' });

          const msg = await Message.create({
            consultationId,
            senderId: socket.user.id,
            receiverId,
            type,
            content: content || undefined,
            fileUrl: data?.fileUrl,
            fileName: data?.fileName,
            fileSize: typeof data?.fileSize === 'number' ? data.fileSize : undefined,
            isRead: false,
          });

          const payload = msg.toObject();
          io!.to(`consultation:${consultationId}`).emit('new_message', payload);
          // Also deliver to the recipient's personal room so the in-app inbox
          // can update even if they haven't joined the consultation room yet.
          io!.to(`user:${receiverId}`).emit('new_message', payload);

          // Best-effort push notification — fire-and-forget; never block the
          // socket ack on it. The receiver may not be on the chat screen.
          sendToUser({
            userId: receiverId,
            type: 'general',
            title: 'New message',
            body: type === 'text' ? content.slice(0, 120) : 'Sent you an attachment',
            data: { appointmentId: consultationId, messageId: String(msg._id), kind: 'chat' },
          }).catch(() => undefined);

          ack?.({ ok: true, message: payload });
        } catch (err) {
          logger.error(`[socket] send_message: ${(err as Error).message}`);
          ack?.({ ok: false, error: 'internal error' });
        }
      },
    );

    socket.on('typing_start', async (appointmentId: string) => {
      if (typeof appointmentId !== 'string' || !appointmentId) return;
      socket.to(`consultation:${appointmentId}`).emit('user_typing', {
        userId: socket.user.id,
        isTyping: true,
      });
    });

    socket.on('typing_stop', async (appointmentId: string) => {
      if (typeof appointmentId !== 'string' || !appointmentId) return;
      socket.to(`consultation:${appointmentId}`).emit('user_typing', {
        userId: socket.user.id,
        isTyping: false,
      });
    });

    socket.on(
      'mark_read',
      async (
        data: { consultationId?: string; messageId?: string },
        ack?: (res: unknown) => void,
      ) => {
        try {
          const consultationId = String(data?.consultationId || '');
          const messageId = String(data?.messageId || '');
          if (!consultationId || !messageId) return ack?.({ ok: false, error: 'consultationId and messageId required' });
          const ok = await userBelongsToAppointment(consultationId, socket.user);
          if (!ok) return ack?.({ ok: false, error: 'not authorised' });

          const msg = await Message.findOneAndUpdate(
            { _id: messageId, consultationId, receiverId: socket.user.id, isRead: false },
            { isRead: true, readAt: new Date() },
            { new: true },
          );
          if (msg) {
            io!.to(`consultation:${consultationId}`).emit('message_read', {
              messageId: String(msg._id),
              readBy: socket.user.id,
              readAt: msg.readAt,
            });
          }
          ack?.({ ok: true });
        } catch (err) {
          logger.error(`[socket] mark_read: ${(err as Error).message}`);
          ack?.({ ok: false, error: 'internal error' });
        }
      },
    );

    socket.on('disconnect', () => {
      logger.info(`[socket] disconnected user=${socket.user.id} sid=${socket.id}`);
    });
  });

  logger.info('[socket] Socket.io initialised');
  return io;
}
