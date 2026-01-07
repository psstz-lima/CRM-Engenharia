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

            // Verificar se há usuários usando este perfil
            const usersCount = await prisma.user.count({ where: { roleId: id } });
            if (usersCount > 0) {
                return res.status(400).json({
                    error: `Não é possível excluir. Existem ${usersCount} usuário(s) usando este perfil.`
                });
            }

            // Deletar permanentemente
            await prisma.role.delete({ where: { id } });
            res.json({ message: 'Perfil excluído permanentemente' });
        } catch (e: any) {
            res.status(500).json({ error: e.message });
        }
    }
}
