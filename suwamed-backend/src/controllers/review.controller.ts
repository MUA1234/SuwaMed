import { Request, Response, NextFunction } from 'express';
import Review from '../models/Review.model';
import Doctor from '../models/Doctor.model';
import Appointment from '../models/Appointment.model';
import { AppError } from '../utils/errorResponse';

// POST /api/reviews — create a review (patient only)
export const createReview = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const patientId = (req as any).user.id;
    const { appointmentId, doctorId, rating, comment, isAnonymous } = req.body;

    if (!appointmentId || !doctorId || !rating) {
      throw new AppError('appointmentId, doctorId and rating are required', 400);
    }

    if (rating < 1 || rating > 5) {
      throw new AppError('Rating must be between 1 and 5', 400);
    }

    // Verify the appointment belongs to this patient and is completed
    const appointment = await Appointment.findOne({
      _id: appointmentId,
      patientId,
      status: 'completed',
    });
    if (!appointment) {
      throw new AppError('Completed appointment not found for this patient', 404);
    }

    // Prevent duplicate reviews for the same appointment
    const existing = await Review.findOne({ appointmentId, patientId });
    if (existing) {
      throw new AppError('You have already submitted a review for this appointment', 409);
    }

    const review = await Review.create({
      appointmentId,
      patientId,
      doctorId,
      rating,
      comment,
      isAnonymous: isAnonymous ?? false,
    });

    // Update doctor's rating average and count
    const doctor = await Doctor.findById(doctorId);
    if (doctor) {
      const currentCount = doctor.rating.count;
      const currentAverage = doctor.rating.average;
      const newCount = currentCount + 1;
      const newAverage = ((currentAverage * currentCount) + rating) / newCount;

      await Doctor.findByIdAndUpdate(doctorId, {
        'rating.average': Math.round(newAverage * 10) / 10,
        'rating.count': newCount,
      });
    }

    // Link review to appointment
    await Appointment.findByIdAndUpdate(appointmentId, { review: review._id });

    res.status(201).json({ success: true, data: review });
  } catch (error) {
    next(error);
  }
};

// GET /api/reviews/my — get reviews submitted by the logged-in patient
export const getMyReviews = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const patientId = (req as any).user.id;
    const reviews = await Review.find({ patientId })
      .populate('doctorId', 'userId specialization rating')
      .populate('appointmentId', 'date type')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: reviews });
  } catch (error) {
    next(error);
  }
};
