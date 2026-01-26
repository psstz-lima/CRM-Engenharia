import { Request, Response } from 'express';
import prisma from '../config/database';

export class AlertRuleController {
        static async list(req: Request, res: Response) {
        try {
            const { contractId } = req.query;
            const rules = await prisma.alertRule.findMany({
                where: contractId ? { contractId: String(contractId) } : {},
                orderBy: { createdAt: 'desc' }
            });
            return res.json(rules);
        } catch (e: any) {
            return res.status(500).json({ error: e.message });
        }
    }

    static async create(req: Request, res: Response) {
        try {
            const { name, type, isActive = true, thresholdDays, metadata, contractId } = req.body;
            if (!name || !type) {
                return res.status(400).json({ error: 'name e type são obrigatórios' });
            }
            const rule = await prisma.alertRule.create({
                data: { name, type, isActive, thresholdDays, metadata, contractId }
            });
            return res.status(201).json(rule);
        } catch (e: any) {
            return res.status(500).json({ error: e.message });
        }
    }

    static async update(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const rule = await prisma.alertRule.update({
                where: { id },
                data: req.body
            });
            return res.json(rule);
        } catch (e: any) {
            return res.status(500).json({ error: e.message });
        }
    }

    static async delete(req: Request, res: Response) {
        try {
            const { id } = req.params;
            await prisma.alertRule.delete({ where: { id } });
            return res.status(204).send();
        } catch (e: any) {
            return res.status(500).json({ error: e.message });
        }
    }
}
