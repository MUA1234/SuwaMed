import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errorResponse';

export const authorize = (...roles: string[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const user = (req as any).user;
    if (!user) {
      return next(new AppError('Not authorized', 401));
    }

    if (!roles.includes(user.role)) {
      return next(new AppError('Not authorized to access this route', 403));
    }

    next();
  };
};
