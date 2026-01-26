import { Request, Response } from 'express';
import prisma from '../config/database';

export class ApprovalFlowController {
    static async getByContract(req: Request, res: Response) {
        try {
            const { contractId } = req.params;
            const flow = await prisma.contractApprovalFlow.findFirst({
                where: { contractId, isActive: true },
                include: { steps: { include: { approvalLevel: true }, orderBy: { orderIndex: 'asc' } } }
            });
            return res.json(flow);
        } catch (e: any) {
            return res.status(500).json({ error: e.message });
        }
    }

    static async upsert(req: Request, res: Response) {
        try {
            const { contractId } = req.params;
            const { name, isActive = true, steps } = req.body;
            if (!name || !Array.isArray(steps) || steps.length === 0) {
                return res.status(400).json({ error: 'name e steps sÃ£o obrigatÃ³rios' });
            }

            const existing = await prisma.contractApprovalFlow.findFirst({ where: { contractId } });

            const flow = existing
                ? await prisma.contractApprovalFlow.update({
                    where: { id: existing.id },
                    data: { name, isActive }
                })
                : await prisma.contractApprovalFlow.create({
                    data: { contractId, name, isActive }
                });

            await prisma.contractApprovalStep.deleteMany({ where: { flowId: flow.id } });
            await prisma.contractApprovalStep.createMany({
                data: steps.map((s: any, index: number) => ({
                    flowId: flow.id,
                    approvalLevelId: s.approvalLevelId,
                    orderIndex: s.orderIndex ?? index + 1,
                    required: s.required ?? false
                }))
            });

            const result = await prisma.contractApprovalFlow.findUnique({
                where: { id: flow.id },
                include: { steps: { include: { approvalLevel: true }, orderBy: { orderIndex: 'asc' } } }
            });

            return res.json(result);
        } catch (e: any) {
            return res.status(500).json({ error: e.message });
        }
    }
}

