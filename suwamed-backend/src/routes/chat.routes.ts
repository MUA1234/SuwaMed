import { Router } from 'express';
import { protect } from '../middleware/auth.middleware';
import { AppError } from '../utils/errorResponse';

const router = Router();

router.use(protect);

// Chat functionality is handled via Socket.IO (real-time).
// These REST endpoints provide message history and management.

// GET /api/chat — get chat history placeholder
router.get('/', (_req, _res, next) => {
  next(new AppError('Chat messages are delivered via real-time connection. Use Socket.IO to send and receive messages.', 501));
});

// GET /api/chat/:appointmentId — get chat messages for an appointment
router.get('/:appointmentId', (_req, _res, next) => {
  next(new AppError('Chat history retrieval is not yet available', 501));
});

export default router;
