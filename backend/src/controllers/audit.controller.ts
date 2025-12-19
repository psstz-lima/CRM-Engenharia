import { Request, Response } from 'express';
import prisma from '../config/database';

export class AuditLogController {
    static async list(req: Request, res: Response) {
        try {
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 50;
            const skip = (page - 1) * limit;

            const [logs, total] = await Promise.all([
                prisma.auditLog.findMany({
                    include: { user: { select: { fullName: true, email: true } } },
                    orderBy: { createdAt: 'desc' },
                    skip,
                    take: limit
                }),
                prisma.auditLog.count()
            ]);

            res.json({
                data: logs,
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
}
