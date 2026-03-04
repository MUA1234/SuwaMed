import { Request, Response, NextFunction } from 'express';
import HealthRecord from '../models/HealthRecord.model';
import { AppError } from '../utils/errorResponse';

// GET /api/health-records — records for logged-in patient
export const getRecords = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userId = (req as any).user.id;
        const { category } = req.query;

        const filter: any = { patientId: userId };
        if (category) filter.category = category;

        const records = await HealthRecord.find(filter).sort({ date: -1, createdAt: -1 });
        res.status(200).json({ success: true, data: records });
    } catch (error) {
        next(error);
    }
};

// POST /api/health-records — create a new health record for logged-in patient
export const createRecord = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userId = (req as any).user.id;
        const { title, category, description, date, doctor, hospital, tags, fileUrl, fileType, fileSize } = req.body;

        if (!title || !category) {
            throw new AppError('title and category are required', 400);
        }

        const record = await HealthRecord.create({
            patientId: userId,
            title,
            category,
            description,
            date,
            doctor,
            hospital,
            tags: tags || [],
            fileUrl,
            fileType,
            fileSize,
        });

        res.status(201).json({ success: true, data: record });
    } catch (error) {
        next(error);
    }
};

// GET /api/health-records/:id — single health record
export const getRecordById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userId = (req as any).user.id;
        const record = await HealthRecord.findOne({ _id: req.params.id, patientId: userId });
        if (!record) throw new AppError('Health record not found', 404);
        res.status(200).json({ success: true, data: record });
    } catch (error) {
        next(error);
    }
};
