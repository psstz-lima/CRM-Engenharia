import { Request, Response } from 'express';
import prisma from '../config/database';

export class RoleController {
    static async list(req: Request, res: Response) {
        try {
            const roles = await prisma.role.findMany();
            res.json(roles);
        } catch (e: any) {
            res.status(500).json({ error: e.message });
        }
    }

    static async create(req: Request, res: Response) {
        try {
            const role = await prisma.role.create({ data: req.body });
            res.json(role);
        } catch (e: any) {
            res.status(500).json({ error: e.message });
        }
    }

    static async update(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { name, description, permissions, isActive } = req.body;
            const role = await prisma.role.update({
                where: { id },
                data: { name, description, permissions, isActive }
            });
            res.json(role);
        } catch (e: any) {
            res.status(500).json({ error: e.message });
        }
    }

    static async delete(req: Request, res: Response) {
        try {
            const { id } = req.params;
            await prisma.role.update({ where: { id }, data: { isActive: false } });
            res.json({ message: 'Perfil desativado' });
        } catch (e: any) {
            res.status(500).json({ error: e.message });
        }
    }
}
