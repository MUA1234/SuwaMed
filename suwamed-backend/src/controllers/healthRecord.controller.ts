import { Request, Response, NextFunction } from 'express';
import HealthRecord from '../models/HealthRecord.model';
import { AppError } from '../utils/errorResponse';
import { uploadToCloudinary } from '../services/upload.service';

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

// POST /api/health-records — create a new health record for logged-in patient.
// Accepts multipart/form-data with an optional `file` field (image or PDF). When
// a file is attached, it is uploaded to Cloudinary and the resulting URL is stored
// on the record. When the body is plain JSON without a file, only metadata is saved.
// `tags` may arrive as a JSON-stringified array (multipart) or as an array (JSON).
export const createRecord = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userId = (req as any).user.id;
        const { title, category, description, date, doctor, hospital } = req.body;

        if (!title || !category) {
            throw new AppError('title and category are required', 400);
        }

        let tags: string[] = [];
        if (Array.isArray(req.body.tags)) {
            tags = req.body.tags;
        } else if (typeof req.body.tags === 'string' && req.body.tags.trim()) {
            try {
                const parsed = JSON.parse(req.body.tags);
                tags = Array.isArray(parsed) ? parsed : [];
            } catch {
                tags = req.body.tags
                    .split(',')
                    .map((t: string) => t.trim())
                    .filter(Boolean);
            }
        }

        let fileUrl: string | undefined = req.body.fileUrl;
        let fileType: string | undefined = req.body.fileType;
        let fileSize: number | undefined = req.body.fileSize ? Number(req.body.fileSize) : undefined;

        // Multer attaches the uploaded file when the request was multipart.
        const uploaded = (req as any).file as Express.Multer.File | undefined;
        if (uploaded) {
            fileUrl = await uploadToCloudinary(uploaded.buffer, `suwamed/health-records/${userId}`);
            fileType = uploaded.mimetype;
            fileSize = uploaded.size;
        }

        const record = await HealthRecord.create({
            patientId: userId,
            title,
            category,
            description,
            date,
            doctor,
            hospital,
            tags,
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
