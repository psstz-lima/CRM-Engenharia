import { Response, NextFunction } from 'express';
import prisma from '../config/database';

export const auditMiddleware = (action: string, module: string) => {
    return async (req: any, res: Response, next: NextFunction) => {
        res.on('finish', async () => {
            if (res.statusCode >= 200 && res.statusCode < 300) {
                try {
                    const userId = req.user?.id;
                    const ip = req.ip || req.connection.remoteAddress;
                    const userAgent = req.headers['user-agent'];

                    await prisma.auditLog.create({
                        data: {
                            userId,
                            action,
                            module,
                            entityId: req.params.id || req.body.id || null,
                            entityType: module,
                            ipAddress: typeof ip === 'string' ? ip : 'Unknown',
                            userAgent: userAgent,
                            status: 'SUCCESS',
                            metadata: { body: req.body, params: req.params, query: req.query }
                        }
                    });
                } catch (error) {
                    console.error('Erro ao criar log de auditoria:', error);
                }
            }
        });
        next();
    };
};
