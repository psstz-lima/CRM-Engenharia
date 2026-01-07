import { Request, Response } from 'express';
import prisma from '../config/database';

export class FavoriteController {
    // List user favorites
    static async list(req: any, res: Response) {
        try {
            const userId = req.user?.id;
            const { targetType } = req.query;

            const where: any = { userId };
            if (targetType) {
                where.targetType = targetType;
            }

            const favorites = await prisma.userFavorite.findMany({
                where,
                orderBy: { createdAt: 'desc' }
            });

            // Enrich with target data
            const enriched = await Promise.all(favorites.map(async (fav) => {
                let targetData = null;

                if (fav.targetType === 'CONTRACT') {
                    targetData = await prisma.contract.findUnique({
                        where: { id: fav.targetId },
                        select: { number: true, company: { select: { name: true } } }
                    });
                } else if (fav.targetType === 'MEASUREMENT') {
                    targetData = await prisma.measurement.findUnique({
                        where: { id: fav.targetId },
                        select: {
                            number: true,
                            contract: { select: { number: true, company: { select: { name: true } } } }
                        }
                    });
                }

                return { ...fav, targetData };
            }));

            res.json(enriched);
        } catch (e: any) {
            res.status(500).json({ error: e.message });
        }
    }

    // Toggle favorite
    static async toggle(req: any, res: Response) {
        try {
            const userId = req.user?.id;
            const { targetType, targetId } = req.body;

            if (!targetType || !targetId) {
                return res.status(400).json({ error: 'targetType e targetId são obrigatórios' });
            }

            // Check if already favorited
            const existing = await prisma.userFavorite.findUnique({
                where: {
                    userId_targetType_targetId: { userId, targetType, targetId }
                }
            });

            if (existing) {
                // Remove
                await prisma.userFavorite.delete({ where: { id: existing.id } });
                res.json({ favorited: false, message: 'Removido dos favoritos' });
            } else {
                // Add
                await prisma.userFavorite.create({
                    data: { userId, targetType, targetId }
                });
                res.json({ favorited: true, message: 'Adicionado aos favoritos' });
            }
        } catch (e: any) {
            res.status(500).json({ error: e.message });
        }
    }

    // Check if favorited
    static async check(req: any, res: Response) {
        try {
            const userId = req.user?.id;
            const { targetType, targetId } = req.params;

            const existing = await prisma.userFavorite.findUnique({
                where: {
                    userId_targetType_targetId: { userId, targetType, targetId }
                }
            });

            res.json({ favorited: !!existing });
        } catch (e: any) {
            res.status(500).json({ error: e.message });
        }
    }

    // Remove favorite
    static async remove(req: any, res: Response) {
        try {
            const userId = req.user?.id;
            const { id } = req.params;

            const favorite = await prisma.userFavorite.findFirst({
                where: { id, userId }
            });

            if (!favorite) {
                return res.status(404).json({ error: 'Favorito não encontrado' });
            }

            await prisma.userFavorite.delete({ where: { id } });
            res.json({ message: 'Favorito removido' });
        } catch (e: any) {
            res.status(500).json({ error: e.message });
        }
    }
}
