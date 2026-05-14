import { Router } from 'express';
import { protect } from '../middleware/auth.middleware';
import {
  createTicket,
  listTickets,
  getTicket,
  replyTicket,
  updateTicketStatus,
} from '../controllers/supportTicket.controller';

const router = Router();

router.use(protect);
router.post('/', createTicket);
router.get('/', listTickets);
router.get('/:id', getTicket);
router.post('/:id/messages', replyTicket);
router.patch('/:id/status', updateTicketStatus);

export default router;
