import { Response } from 'express';
import prisma from '../config/database';

export class NotificationController {
    static async list(req: any, res: Response) {
        try {
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 1000;
            const skip = (page - 1) * limit;

            const [notifications, total] = await Promise.all([
                prisma.notification.findMany({
                    where: { userId: req.user.id },
                    orderBy: { createdAt: 'desc' },
                    skip,
                    take: limit
                }),
                prisma.notification.count({ where: { userId: req.user.id } })
            ]);

            res.json({
                data: notifications,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit)
                }
            });
        } catch (e: any) {
            res.status(500).json({ error: e.message });
        }
    }

    static async markAsRead(req: any, res: Response) {
        try {
            const { id } = req.params;
            await prisma.notification.update({
                where: { id },
                data: { read: true }
            });
            res.json({ message: 'Marcada como lida' });
        } catch (e: any) {
            res.status(500).json({ error: e.message });
        }
    }

    static async markAllAsRead(req: any, res: Response) {
        try {
            await prisma.notification.updateMany({
                where: { userId: req.user.id, read: false },
                data: { read: true }
            });
            res.json({ message: 'Todas marcadas como lidas' });
        } catch (e: any) {
            res.status(500).json({ error: e.message });
        }
    }
}
