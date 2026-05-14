import { Request, Response, NextFunction } from 'express';
import Prescription from '../models/Prescription.model';
import Doctor from '../models/Doctor.model';
import Appointment from '../models/Appointment.model';
import { AppError } from '../utils/errorResponse';
import { sendToUser } from '../services/notification.service';

// POST /api/prescriptions — create a prescription (doctor only)
export const createPrescription = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const role = (req as any).user.role;

    if (role !== 'doctor') {
      throw new AppError('Only doctors can create prescriptions', 403);
    }

    const doctor = await Doctor.findOne({ userId });
    if (!doctor) throw new AppError('Doctor profile not found', 404);

    const {
      appointmentId,
      patientId,
      diagnosis,
      medications,
      additionalNotes,
      followUpDate,
      followUpInstructions,
    } = req.body;

    if (!appointmentId || !patientId) {
      throw new AppError('appointmentId and patientId are required', 400);
    }

    // Verify the appointment belongs to this doctor
    const appointment = await Appointment.findOne({ _id: appointmentId, doctorId: doctor._id });
    if (!appointment) throw new AppError('Appointment not found for this doctor', 404);

    const prescription = await Prescription.create({
      appointmentId,
      doctorId: doctor._id,
      patientId,
      diagnosis,
      medications: medications || [],
      additionalNotes,
      followUpDate,
      followUpInstructions,
      issuedAt: new Date(),
    });

    // Link prescription to the appointment
    await Appointment.findByIdAndUpdate(appointmentId, { prescription: prescription._id });

    const populated = await Prescription.findById(prescription._id)
      .populate('doctorId', 'userId specialization')
      .populate('patientId', 'firstName lastName')
      .populate('appointmentId', 'date type');

    await sendToUser({
      userId: String(patientId),
      type: 'prescription_ready',
      title: 'New prescription available',
      body: diagnosis ? `Diagnosis: ${String(diagnosis).slice(0, 120)}` : 'Your doctor has issued a new prescription.',
      data: { prescriptionId: String(prescription._id), appointmentId: String(appointmentId) },
    });

    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    next(error);
  }
};

// GET /api/prescriptions — list prescriptions
// Patient: where patientId = userId
// Doctor: where doctorId = doctor._id
export const getPrescriptions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const role = (req as any).user.role;

    let filter: any = {};

    if (role === 'patient') {
      filter = { patientId: userId };
    } else if (role === 'doctor') {
      const doctor = await Doctor.findOne({ userId });
      if (!doctor) throw new AppError('Doctor profile not found', 404);
      filter = { doctorId: doctor._id };
      // Allow filtering by specific patient
      if (req.query.patientId) {
        filter.patientId = req.query.patientId;
      }
    } else {
      throw new AppError('Access denied', 403);
    }

    const prescriptions = await Prescription.find(filter)
      .populate({
        path: 'doctorId',
        select: 'userId specialization',
        populate: { path: 'userId', select: 'firstName lastName' },
      })
      .populate('patientId', 'firstName lastName')
      .populate('appointmentId', 'date type')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: prescriptions });
  } catch (error) {
    next(error);
  }
};

// GET /api/prescriptions/:id — single prescription (detailed)
export const getPrescriptionById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const role = (req as any).user.role;

    const prescription = await Prescription.findById(req.params.id)
      .populate({
        path: 'doctorId',
        select: 'userId specialization consultationFee',
        populate: { path: 'userId', select: 'firstName lastName avatar' },
      })
      .populate('patientId', 'firstName lastName dateOfBirth gender phone')
      .populate('appointmentId', 'date type status');

    if (!prescription) throw new AppError('Prescription not found', 404);

    // Ensure patients and doctors can only access their own prescriptions
    if (role === 'patient' && prescription.patientId._id.toString() !== userId) {
      throw new AppError('Access denied', 403);
    }

    if (role === 'doctor') {
      const doctor = await Doctor.findOne({ userId });
      if (!doctor || prescription.doctorId._id.toString() !== doctor._id.toString()) {
        throw new AppError('Access denied', 403);
      }
    }

    res.status(200).json({ success: true, data: prescription });
  } catch (error) {
    next(error);
  }
};
