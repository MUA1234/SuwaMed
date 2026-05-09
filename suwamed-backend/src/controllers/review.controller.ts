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

// Helper: recompute a doctor's rating average + count from all reviews.
// Authoritative single source of truth; used by update/delete to avoid drift.
const recomputeDoctorRating = async (doctorId: any) => {
  const reviews = await Review.find({ doctorId });
  const count = reviews.length;
  const average = count
    ? Math.round((reviews.reduce((sum, r) => sum + r.rating, 0) / count) * 10) / 10
    : 0;
  await Doctor.findByIdAndUpdate(doctorId, {
    'rating.average': average,
    'rating.count': count,
  });
};

// GET /api/reviews/:id — fetch a single review
export const getReviewById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const review = await Review.findById(req.params.id)
      .populate('doctorId', 'userId specialization rating')
      .populate('appointmentId', 'date type')
      .populate('patientId', 'firstName lastName avatar');
    if (!review) throw new AppError('Review not found', 404);
    res.status(200).json({ success: true, data: review });
  } catch (error) {
    next(error);
  }
};

// PUT /api/reviews/:id — patient updates their own review (within 24h)
export const updateReview = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const patientId = (req as any).user.id;
    const { rating, comment, isAnonymous } = req.body;

    const review = await Review.findById(req.params.id);
    if (!review) throw new AppError('Review not found', 404);
    if (String(review.patientId) !== String(patientId)) {
      throw new AppError('You can only edit your own reviews', 403);
    }

    const ageMs = Date.now() - new Date((review as any).createdAt).getTime();
    const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;
    if (ageMs > TWENTY_FOUR_HOURS) {
      throw new AppError('Reviews can only be edited within 24 hours of submission', 403);
    }

    if (rating !== undefined) {
      if (rating < 1 || rating > 5) throw new AppError('Rating must be between 1 and 5', 400);
      review.rating = rating;
    }
    if (comment !== undefined) review.comment = comment;
    if (isAnonymous !== undefined) review.isAnonymous = !!isAnonymous;

    await review.save();
    if (rating !== undefined) await recomputeDoctorRating(review.doctorId);

    res.status(200).json({ success: true, data: review });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/reviews/:id — patient (own) or admin
export const deleteReview = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const role = (req as any).user.role;

    const review = await Review.findById(req.params.id);
    if (!review) throw new AppError('Review not found', 404);

    if (role !== 'admin' && String(review.patientId) !== String(userId)) {
      throw new AppError('You can only delete your own reviews', 403);
    }

    const doctorId = review.doctorId;
    const appointmentId = review.appointmentId;
    await review.deleteOne();
    await recomputeDoctorRating(doctorId);
    if (appointmentId) {
      await Appointment.findByIdAndUpdate(appointmentId, { $unset: { review: '' } });
    }

    res.status(200).json({ success: true, message: 'Review deleted' });
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
