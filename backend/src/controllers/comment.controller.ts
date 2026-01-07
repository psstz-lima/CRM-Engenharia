import { Request, Response } from 'express';
import prisma from '../config/database';

export class CommentController {

    // Criar comentário
    static async create(req: Request, res: Response) {
        try {
            const userId = (req as any).userId;
            const { content, targetType, targetId, linkedItemId, linkedItemCode, linkedItemDescription } = req.body;

            if (!content || !targetType || !targetId) {
                return res.status(400).json({ error: 'Campos obrigatórios: content, targetType, targetId' });
            }

            const comment = await prisma.comment.create({
                data: {
                    userId,
                    content,
                    targetType,
                    targetId,
                    linkedItemId: linkedItemId || null,
                    linkedItemCode: linkedItemCode || null,
                    linkedItemDescription: linkedItemDescription || null
                }
            });

            return res.status(201).json(comment);
        } catch (e: any) {
            return res.status(500).json({ error: e.message });
        }
    }

    // Listar comentários por item
    static async list(req: Request, res: Response) {
        try {
            const { targetType, targetId } = req.params;

            const comments = await prisma.comment.findMany({
                where: {
                    targetType: targetType as any,
                    targetId
                },
                orderBy: { createdAt: 'desc' }
            });

            // Buscar nomes dos usuários
            const userIds = [...new Set(comments.map(c => c.userId))];
            const users = await prisma.user.findMany({
                where: { id: { in: userIds } },
                select: { id: true, fullName: true, profilePhoto: true }
            });

            const userMap = Object.fromEntries(users.map(u => [u.id, u]));

            const commentsWithUsers = comments.map(c => ({
                ...c,
                user: userMap[c.userId] || { fullName: 'Usuário removido' }
            }));

            return res.json(commentsWithUsers);
        } catch (e: any) {
            return res.status(500).json({ error: e.message });
        }
    }

    // Deletar comentário (apenas autor)
    static async delete(req: Request, res: Response) {
        try {
            const userId = (req as any).userId;
            const { id } = req.params;

            const comment = await prisma.comment.findUnique({ where: { id } });

            if (!comment) {
                return res.status(404).json({ error: 'Comentário não encontrado' });
            }

            if (comment.userId !== userId) {
                return res.status(403).json({ error: 'Você só pode deletar seus próprios comentários' });
            }

            await prisma.comment.delete({ where: { id } });

            return res.json({ message: 'Comentário removido' });
        } catch (e: any) {
            return res.status(500).json({ error: e.message });
        }
    }
}
