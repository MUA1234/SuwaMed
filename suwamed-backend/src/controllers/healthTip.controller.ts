import { Request, Response, NextFunction } from 'express';
import HealthTip from '../models/HealthTip.model';

// GET /api/health-tips/admin/all — all tips (admin only, includes unpublished)
export const getAllHealthTipsAdmin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const tips = await HealthTip.find({}).sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: tips });
    } catch (error) {
        next(error);
    }
};

// POST /api/health-tips — create a new health tip (admin only)
export const createHealthTip = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { title, content, category, language, tags, isPublished } = req.body;
        if (!title || !content || !category) {
            throw new Error('title, content, and category are required');
        }
        const tip = await HealthTip.create({
            title, content, category,
            language: language || 'en',
            tags: tags || [],
            isPublished: isPublished ?? false,
            publishedAt: isPublished ? new Date() : undefined,
        });
        res.status(201).json({ success: true, data: tip });
    } catch (error) {
        next(error);
    }
};

// PUT /api/health-tips/:id — toggle publish or update fields (admin only)
export const updateHealthTip = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { isPublished, title, content, category, tags } = req.body;
        const updates: any = {};
        if (title !== undefined) updates.title = title;
        if (content !== undefined) updates.content = content;
        if (category !== undefined) updates.category = category;
        if (tags !== undefined) updates.tags = tags;
        if (isPublished !== undefined) {
            updates.isPublished = isPublished;
            if (isPublished) updates.publishedAt = new Date();
        }
        const tip = await HealthTip.findByIdAndUpdate(req.params.id, updates, { new: true });
        if (!tip) throw new Error('Health tip not found');
        res.status(200).json({ success: true, data: tip });
    } catch (error) {
        next(error);
    }
};

// DELETE /api/health-tips/:id — delete a health tip (admin only)
export const deleteHealthTip = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const tip = await HealthTip.findByIdAndDelete(req.params.id);
        if (!tip) throw new Error('Health tip not found');
        res.status(200).json({ success: true, message: 'Health tip deleted' });
    } catch (error) {
        next(error);
    }
};

// PATCH /api/health-tips/:id/view — increment viewCount (public)
export const incrementHealthTipView = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const tip = await HealthTip.findByIdAndUpdate(
            req.params.id,
            { $inc: { viewCount: 1 } },
            { new: true, projection: { viewCount: 1 } }
        );
        if (!tip) throw new Error('Health tip not found');
        res.status(200).json({ success: true, data: { viewCount: tip.viewCount } });
    } catch (error) {
        next(error);
    }
};

// GET /api/health-tips — published health tips
export const getHealthTips = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { language, category } = req.query;
        const filter: any = { isPublished: true };
        if (language) filter.language = language;
        if (category) filter.category = category;

        const tips = await HealthTip.find(filter)
            .sort({ publishedAt: -1 })
            .limit(20);
        res.status(200).json({ success: true, data: tips });
    } catch (error) {
        next(error);
    }
};
