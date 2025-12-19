import { Request, Response } from 'express';
import prisma from '../config/database';

export class CompanyController {
    static async list(req: Request, res: Response) {
        try {
            const companies = await prisma.company.findMany();
            res.json(companies);
        } catch (e: any) {
            res.status(500).json({ error: e.message });
        }
    }

    static async create(req: Request, res: Response) {
        try {
            const company = await prisma.company.create({ data: req.body });
            res.json(company);
        } catch (e: any) {
            res.status(500).json({ error: e.message });
        }
    }

    static async update(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const company = await prisma.company.update({ where: { id }, data: req.body });
            res.json(company);
        } catch (e: any) {
            res.status(500).json({ error: e.message });
        }
    }

    static async delete(req: any, res: Response) {
        try {
            const { id } = req.params;
            if (req.user?.companyId === id) {
                return res.status(400).json({ error: 'Você não pode excluir sua própria empresa.' });
            }
            await prisma.company.delete({ where: { id } });
            res.json({ message: 'Empresa removida com sucesso' });
        } catch (e: any) {
            console.error('Erro ao excluir empresa:', e);
            const isForeignKeyError =
                e.code === 'P2003' ||
                e.message?.includes('Foreign key constraint') ||
                e.message?.includes('23001');

            if (isForeignKeyError) {
                return res.status(400).json({ error: 'Não é possível excluir esta empresa pois existem registros vinculados a ela (Usuários, Contratos, etc).' });
            }
            res.status(500).json({ error: e.message });
        }
    }
}
