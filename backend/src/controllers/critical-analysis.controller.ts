import { Request, Response } from 'express';
import prisma from '../config/database';

export class CriticalAnalysisController {
    // Listar análises pendentes
    static async listPending(req: Request, res: Response) {
        try {
            const { reviewerId } = req.query;

            const where: any = {
                status: { in: ['PENDING', 'IN_PROGRESS'] }
            };
            if (reviewerId) where.reviewerId = reviewerId;

            const analyses = await prisma.criticalAnalysis.findMany({
                where,
                include: {
                    document: {
                        include: {
                            category: true,
                            contract: { select: { number: true, company: { select: { name: true } } } }
                        }
                    }
                },
                orderBy: [{ deadline: 'asc' }, { createdAt: 'asc' }]
            });

            res.json(analyses);
        } catch (e: any) {
            res.status(500).json({ error: e.message });
        }
    }

    // Criar análise crítica para documento
    static async create(req: any, res: Response) {
        try {
            const { documentId, reviewerId, reviewerName, deadline } = req.body;

            // Verificar documento
            const document = await prisma.projectDocument.findUnique({ where: { id: documentId } });
            if (!document) {
                return res.status(404).json({ error: 'Documento não encontrado' });
            }

            // Verificar se já existe análise pendente
            const existing = await prisma.criticalAnalysis.findFirst({
                where: { documentId, status: { in: ['PENDING', 'IN_PROGRESS'] } }
            });
            if (existing) {
                return res.status(400).json({ error: 'Já existe uma análise pendente para este documento' });
            }

            const analysis = await prisma.criticalAnalysis.create({
                data: {
                    documentId,
                    reviewerId,
                    reviewerName,
                    deadline: deadline ? new Date(deadline) : null
                },
                include: { document: true }
            });

            // Atualizar status do documento
            await prisma.projectDocument.update({
                where: { id: documentId },
                data: { status: 'IN_ANALYSIS' }
            });

            res.status(201).json(analysis);
        } catch (e: any) {
            res.status(500).json({ error: e.message });
        }
    }

    // Iniciar análise
    static async start(req: any, res: Response) {
        try {
            const { id } = req.params;

            const analysis = await prisma.criticalAnalysis.update({
                where: { id },
                data: {
                    status: 'IN_PROGRESS',
                    startedAt: new Date(),
                    reviewerId: req.user?.id,
                    reviewerName: req.user?.fullName
                }
            });

            res.json(analysis);
        } catch (e: any) {
            res.status(500).json({ error: e.message });
        }
    }

    // Concluir análise
    static async complete(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { result, observations, pendencies, technicalNotes } = req.body;

            if (!result) {
                return res.status(400).json({ error: 'Resultado é obrigatório' });
            }

            const analysis = await prisma.criticalAnalysis.update({
                where: { id },
                data: {
                    status: 'COMPLETED',
                    result,
                    observations,
                    pendencies,
                    technicalNotes,
                    completedAt: new Date()
                },
                include: { document: true }
            });

            // Atualizar status do documento
            let newStatus = 'RECEIVED';
            if (result === 'APPROVED') newStatus = 'APPROVED';
            else if (result === 'APPROVED_NOTES') newStatus = 'APPROVED_NOTES';
            else if (result === 'REJECTED') newStatus = 'REJECTED';

            await prisma.projectDocument.update({
                where: { id: analysis.documentId },
                data: {
                    status: newStatus as any,
                    analyzedAt: new Date(),
                    approvedAt: result !== 'REJECTED' ? new Date() : null
                }
            });

            res.json(analysis);
        } catch (e: any) {
            res.status(500).json({ error: e.message });
        }
    }

    // Histórico de análises do documento
    static async history(req: Request, res: Response) {
        try {
            const { documentId } = req.params;

            const analyses = await prisma.criticalAnalysis.findMany({
                where: { documentId },
                orderBy: { createdAt: 'desc' }
            });

            res.json(analyses);
        } catch (e: any) {
            res.status(500).json({ error: e.message });
        }
    }

    // Dashboard de análises
    static async dashboard(req: Request, res: Response) {
        try {
            const [pending, inProgress, completed, overdue] = await Promise.all([
                prisma.criticalAnalysis.count({ where: { status: 'PENDING' } }),
                prisma.criticalAnalysis.count({ where: { status: 'IN_PROGRESS' } }),
                prisma.criticalAnalysis.count({ where: { status: 'COMPLETED' } }),
                prisma.criticalAnalysis.count({
                    where: {
                        status: { in: ['PENDING', 'IN_PROGRESS'] },
                        deadline: { lt: new Date() }
                    }
                })
            ]);

            res.json({ pending, inProgress, completed, overdue });
        } catch (e: any) {
            res.status(500).json({ error: e.message });
        }
    }
}
