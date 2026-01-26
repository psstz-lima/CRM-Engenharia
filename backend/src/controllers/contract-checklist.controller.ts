import { Request, Response } from 'express';
import prisma from '../config/database';

export class ContractChecklistController {
    static async list(req: Request, res: Response) {
        try {
            const { contractId } = req.params;
            const items = await prisma.contractChecklistItem.findMany({
                where: { contractId },
                orderBy: [{ isDone: 'asc' }, { createdAt: 'desc' }]
            });
            return res.json(items);
        } catch (e: any) {
            return res.status(500).json({ error: e.message });
        }
    }

    static async create(req: Request, res: Response) {
        try {
            const { contractId } = req.params;
            const { title, isRequired = true, notes } = req.body;
            if (!title) return res.status(400).json({ error: 'title é obrigatório' });
            const item = await prisma.contractChecklistItem.create({
                data: { contractId, title, isRequired, notes }
            });
            return res.status(201).json(item);
        } catch (e: any) {
            return res.status(500).json({ error: e.message });
        }
    }

    static async update(req: Request, res: Response) {
        try {
            const { itemId } = req.params;
            const data = req.body;
            const item = await prisma.contractChecklistItem.update({
                where: { id: itemId },
                data
            });
            return res.json(item);
        } catch (e: any) {
            return res.status(500).json({ error: e.message });
        }
    }

    static async delete(req: Request, res: Response) {
        try {
            const { itemId } = req.params;
            await prisma.contractChecklistItem.delete({ where: { id: itemId } });
            return res.status(204).send();
        } catch (e: any) {
            return res.status(500).json({ error: e.message });
        }
    }
}
