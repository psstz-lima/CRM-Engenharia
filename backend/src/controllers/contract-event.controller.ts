import { Request, Response } from 'express';
import prisma from '../config/database';

export class ContractEventController {
    static async listByContract(req: Request, res: Response) {
        try {
            const { contractId } = req.params;
            const events = await prisma.contractEvent.findMany({
                where: { contractId },
                orderBy: { createdAt: 'desc' },
                include: { createdBy: { select: { id: true, fullName: true } } }
            });
            return res.json(events);
        } catch (e: any) {
            return res.status(500).json({ error: e.message });
        }
    }
}
