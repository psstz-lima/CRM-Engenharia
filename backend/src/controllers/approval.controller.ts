import { Request, Response } from 'express';
import prisma from '../config/database';

export class ApprovalController {

    // Listar níveis de aprovação
    static async listLevels(req: Request, res: Response) {
        try {
            const levels = await prisma.approvalLevel.findMany({
                where: { isActive: true },
                orderBy: { level: 'asc' }
            });
            return res.json(levels);
        } catch (e: any) {
            return res.status(500).json({ error: e.message });
        }
    }

    // Criar nível de aprovação
    static async createLevel(req: Request, res: Response) {
        try {
            const { name, level, description } = req.body;

            if (!name || !level) {
                return res.status(400).json({ error: 'Campos obrigatórios: name, level' });
            }

            const approvalLevel = await prisma.approvalLevel.create({
                data: { name, level, description }
            });

            return res.status(201).json(approvalLevel);
        } catch (e: any) {
            return res.status(500).json({ error: e.message });
        }
    }

    // Aprovar medição em um nível
    static async approveMeasurement(req: Request, res: Response) {
        try {
            const userId = (req as any).userId;
            const { measurementId, approvalLevelId, notes } = req.body;

            // Buscar usuário
            const user = await prisma.user.findUnique({ where: { id: userId } });
            if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });

            // Buscar medição
            const measurement = await prisma.measurement.findUnique({
                where: { id: measurementId },
                include: { approvals: { include: { approvalLevel: true } } }
            });

            if (!measurement) {
                return res.status(404).json({ error: 'Medição não encontrada' });
            }

            // Medição precisa estar fechada para aprovar
            if (measurement.status === 'DRAFT') {
                return res.status(400).json({ error: 'Medição precisa estar fechada antes de aprovar' });
            }

            // Buscar nível de aprovação
            const level = await prisma.approvalLevel.findUnique({ where: { id: approvalLevelId } });
            if (!level) return res.status(404).json({ error: 'Nível de aprovação não encontrado' });

            // Verificar se níveis anteriores foram aprovados
            const previousLevels = await prisma.approvalLevel.findMany({
                where: { level: { lt: level.level }, isActive: true }
            });

            for (const prevLevel of previousLevels) {
                const hasApproval = measurement.approvals.some(a => a.approvalLevelId === prevLevel.id);
                if (!hasApproval) {
                    return res.status(400).json({
                        error: `Aprovação do nível "${prevLevel.name}" é necessária antes`
                    });
                }
            }

            // Verificar se já foi aprovado neste nível
            const existing = measurement.approvals.find(a => a.approvalLevelId === approvalLevelId);
            if (existing) {
                return res.status(400).json({ error: 'Medição já aprovada neste nível' });
            }

            // Criar aprovação
            const approval = await prisma.measurementApproval.create({
                data: {
                    measurementId,
                    approvalLevelId,
                    approvedById: userId,
                    approvedByName: user.fullName,
                    notes
                },
                include: { approvalLevel: true }
            });

            // Verificar se todas as aprovações foram feitas
            const allLevels = await prisma.approvalLevel.findMany({ where: { isActive: true } });
            const allApprovals = await prisma.measurementApproval.count({
                where: { measurementId }
            });

            if (allApprovals >= allLevels.length) {
                await prisma.measurement.update({
                    where: { id: measurementId },
                    data: { status: 'APPROVED' }
                });
            }

            return res.json(approval);
        } catch (e: any) {
            return res.status(500).json({ error: e.message });
        }
    }

    // Listar aprovações de uma medição
    static async listApprovals(req: Request, res: Response) {
        try {
            const { measurementId } = req.params;

            const approvals = await prisma.measurementApproval.findMany({
                where: { measurementId },
                include: { approvalLevel: true },
                orderBy: { approvalLevel: { level: 'asc' } }
            });

            return res.json(approvals);
        } catch (e: any) {
            return res.status(500).json({ error: e.message });
        }
    }

    // Atualizar nível de aprovação
    static async updateLevel(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { name, level, description, isActive } = req.body;

            const updated = await prisma.approvalLevel.update({
                where: { id },
                data: {
                    name,
                    level,
                    description,
                    isActive
                }
            });

            return res.json(updated);
        } catch (e: any) {
            return res.status(500).json({ error: e.message });
        }
    }

    // Excluir nível de aprovação
    static async deleteLevel(req: Request, res: Response) {
        try {
            const { id } = req.params;

            // Verificar se existem aprovações vinculadas
            const hasApprovals = await prisma.measurementApproval.findFirst({
                where: { approvalLevelId: id }
            });

            if (hasApprovals) {
                return res.status(400).json({ error: 'Não é possível excluir este nível pois existem medições aprovadas com ele. Considere inativá-lo.' });
            }

            await prisma.approvalLevel.delete({
                where: { id }
            });

            return res.status(204).send();
        } catch (e: any) {
            return res.status(500).json({ error: e.message });
        }
    }
}
