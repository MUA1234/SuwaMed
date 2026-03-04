import { Request, Response, NextFunction } from 'express';
import Notification from '../models/Notification.model';
import User from '../models/User.model';
import { AppError } from '../utils/errorResponse';

// GET /api/notifications — list notifications for logged-in user, sorted by createdAt desc
export const getNotifications = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const notifications = await Notification.find({ userId }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: notifications });
  } catch (error) {
    next(error);
  }
};

// PUT /api/notifications/:id/read — mark a single notification as read
export const markAsRead = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId },
      { isRead: true, readAt: new Date() },
      { new: true }
    );
    if (!notification) throw new AppError('Notification not found', 404);
    res.status(200).json({ success: true, data: notification });
  } catch (error) {
    next(error);
  }
};

// PUT /api/notifications/read-all — mark all notifications as read for the user
export const markAllAsRead = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    await Notification.updateMany(
      { userId, isRead: false },
      { isRead: true, readAt: new Date() }
    );
    res.status(200).json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/notifications/:id — delete a notification
export const deleteNotification = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const notification = await Notification.findOneAndDelete({ _id: req.params.id, userId });
    if (!notification) throw new AppError('Notification not found', 404);
    res.status(200).json({ success: true, message: 'Notification deleted' });
  } catch (error) {
    next(error);
  }
};

// POST /api/notifications/register-token — save FCM token to user
export const registerToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const { token } = req.body;
    if (!token) throw new AppError('FCM token is required', 400);

    // Add the token only if it does not already exist in the array
    const user = await User.findByIdAndUpdate(
      userId,
      { $addToSet: { fcmTokens: token } },
      { new: true }
    ).select('-password -refreshToken');

    if (!user) throw new AppError('User not found', 404);
    res.status(200).json({ success: true, message: 'FCM token registered', data: { fcmTokens: user.fcmTokens } });
  } catch (error) {
    next(error);
  }
};
