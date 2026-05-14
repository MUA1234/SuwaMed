import { Request, Response, NextFunction } from 'express';
import SupportTicket from '../models/SupportTicket.model';
import { AppError } from '../utils/errorResponse';
import { sendToUser } from '../services/notification.service';

const VALID_CATEGORY = ['technical', 'payment', 'account', 'consultation', 'other'] as const;
const VALID_PRIORITY = ['low', 'medium', 'high', 'urgent'] as const;
const VALID_STATUS = ['open', 'in_progress', 'resolved', 'closed'] as const;

// POST /api/support-tickets — user creates a ticket.
export const createTicket = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const { subject, description, category, priority } = req.body as {
      subject?: string;
      description?: string;
      category?: string;
      priority?: string;
    };
    if (!subject || subject.trim().length < 3) throw new AppError('subject must be at least 3 chars', 400);
    if (!description || description.trim().length < 10) throw new AppError('description must be at least 10 chars', 400);
    if (!category || !(VALID_CATEGORY as readonly string[]).includes(category)) {
      throw new AppError(`category must be one of ${VALID_CATEGORY.join(', ')}`, 400);
    }
    const prio: typeof VALID_PRIORITY[number] =
      priority && (VALID_PRIORITY as readonly string[]).includes(priority)
        ? (priority as typeof VALID_PRIORITY[number])
        : 'medium';

    const ticket = await SupportTicket.create({
      userId,
      subject: subject.trim().slice(0, 200),
      description: description.trim().slice(0, 5000),
      category,
      priority: prio,
      status: 'open',
      messages: [{ senderId: userId, message: description.trim().slice(0, 5000), attachments: [], sentAt: new Date() }],
    });
    res.status(201).json({ success: true, data: ticket });
  } catch (err) {
    next(err);
  }
};

// GET /api/support-tickets — user lists own tickets; admin sees all.
export const listTickets = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const role = (req as any).user.role;
    const { status, page = '1', limit = '20' } = req.query as Record<string, string>;
    const p = Math.max(parseInt(page, 10) || 1, 1);
    const l = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);

    const filter: Record<string, unknown> = {};
    if (role !== 'admin') filter.userId = userId;
    if (status && (VALID_STATUS as readonly string[]).includes(status)) filter.status = status;

    const [tickets, total] = await Promise.all([
      SupportTicket.find(filter)
        .populate('userId', 'firstName lastName email')
        .sort({ createdAt: -1 })
        .skip((p - 1) * l)
        .limit(l)
        .lean(),
      SupportTicket.countDocuments(filter),
    ]);
    res.status(200).json({ success: true, data: tickets, total, page: p, limit: l });
  } catch (err) {
    next(err);
  }
};

// GET /api/support-tickets/:id — owner or admin.
export const getTicket = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const role = (req as any).user.role;
    const ticket = await SupportTicket.findById(req.params.id)
      .populate('userId', 'firstName lastName email')
      .populate('messages.senderId', 'firstName lastName role');
    if (!ticket) throw new AppError('Ticket not found', 404);
    if (role !== 'admin' && String(ticket.userId._id || ticket.userId) !== String(userId)) {
      throw new AppError('Not authorised', 403);
    }
    res.status(200).json({ success: true, data: ticket });
  } catch (err) {
    next(err);
  }
};

// POST /api/support-tickets/:id/messages — reply (owner or admin).
export const replyTicket = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const role = (req as any).user.role;
    const { message } = req.body as { message?: string };
    if (!message || message.trim().length === 0) throw new AppError('message required', 400);
    if (message.length > 5000) throw new AppError('message too long', 400);

    const ticket = await SupportTicket.findById(req.params.id);
    if (!ticket) throw new AppError('Ticket not found', 404);
    if (role !== 'admin' && String(ticket.userId) !== String(userId)) {
      throw new AppError('Not authorised', 403);
    }

    ticket.messages.push({
      senderId: userId,
      message: message.trim(),
      attachments: [],
      sentAt: new Date(),
    } as any);

    // Admin reply moves an open ticket into "in_progress" once.
    if (role === 'admin' && ticket.status === 'open') ticket.status = 'in_progress';

    await ticket.save();

    // Notify the OTHER side — user replies notify nothing (admin sees inbox);
    // admin replies notify the ticket owner.
    if (role === 'admin') {
      await sendToUser({
        userId: String(ticket.userId),
        type: 'support_reply',
        title: 'Support replied to your ticket',
        body: message.trim().slice(0, 120),
        data: { ticketId: String(ticket._id) },
      });
    }

    res.status(200).json({ success: true, data: ticket });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/support-tickets/:id/status — admin only.
export const updateTicketStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const role = (req as any).user.role;
    if (role !== 'admin') throw new AppError('Only admins can change ticket status', 403);
    const { status } = req.body as { status?: string };
    if (!status || !(VALID_STATUS as readonly string[]).includes(status)) {
      throw new AppError(`status must be one of ${VALID_STATUS.join(', ')}`, 400);
    }
    const update: Record<string, unknown> = { status };
    if (status === 'resolved' || status === 'closed') update.resolvedAt = new Date();
    const ticket = await SupportTicket.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!ticket) throw new AppError('Ticket not found', 404);
    res.status(200).json({ success: true, data: ticket });
  } catch (err) {
    next(err);
  }
};
