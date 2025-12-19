
import { Request, Response } from 'express';
import prisma from '../config/database';

export class UnitController {
    async getAll(req: Request, res: Response) {
        try {
            const units = await prisma.measurementUnit.findMany({
                orderBy: { code: 'asc' }
            });
            return res.json(units);
        } catch (error) {
            console.error('Error fetching units:', error);
            return res.status(500).json({ error: 'Failed to fetch units' });
        }
    }

    async create(req: Request, res: Response) {
        try {
            const { code, description } = req.body;

            if (!code) {
                return res.status(400).json({ error: 'Code (symbol) is required' });
            }

            const existing = await prisma.measurementUnit.findUnique({
                where: { code }
            });

            if (existing) {
                return res.status(400).json({ error: 'Unit code already exists' });
            }

            const unit = await prisma.measurementUnit.create({
                data: {
                    code,
                    description
                }
            });

            return res.status(201).json(unit);
        } catch (error) {
            console.error('Error creating unit:', error);
            return res.status(500).json({ error: 'Failed to create unit' });
        }
    }

    async delete(req: Request, res: Response) {
        try {
            const { id } = req.params;

            await prisma.measurementUnit.delete({
                where: { id }
            });

            return res.status(204).send();
        } catch (error) {
            console.error('Error deleting unit:', error);
            return res.status(500).json({ error: 'Failed to delete unit' });
        }
    }

    async update(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { code, description } = req.body;

            if (!code) {
                return res.status(400).json({ error: 'Code (symbol) is required' });
            }

            const existing = await prisma.measurementUnit.findFirst({
                where: {
                    code,
                    NOT: { id }
                }
            });

            if (existing) {
                return res.status(400).json({ error: 'Unit code already exists' });
            }

            const unit = await prisma.measurementUnit.update({
                where: { id },
                data: { code, description }
            });

            return res.json(unit);
        } catch (error) {
            console.error('Error updating unit:', error);
            return res.status(500).json({ error: 'Failed to update unit' });
        }
    }
}
