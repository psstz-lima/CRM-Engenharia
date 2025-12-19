import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../config/database';
import { config } from '../config';

export class ProfileController {
    static async getProfile(req: any, res: Response) {
        try {
            const user = await prisma.user.findUnique({
                where: { id: req.user.id },
                include: { company: true, role: true },
            });
            res.json(user);
        } catch (e: any) {
            res.status(500).json({ error: e.message });
        }
    }

    static async updateProfile(req: any, res: Response) {
        try {
            const { fullName, preferences } = req.body;
            const user = await prisma.user.update({
                where: { id: req.user.id },
                data: { fullName, preferences },
            });
            res.json(user);
        } catch (e: any) {
            res.status(500).json({ error: e.message });
        }
    }

    static async changePassword(req: any, res: Response) {
        try {
            const { currentPassword, newPassword } = req.body;
            const user = await prisma.user.findUnique({ where: { id: req.user.id } });
            if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });

            const valid = await bcrypt.compare(currentPassword, user.password);
            if (!valid) return res.status(401).json({ error: 'Senha atual incorreta' });

            const hashed = await bcrypt.hash(newPassword, config.security.bcryptRounds);
            await prisma.user.update({ where: { id: req.user.id }, data: { password: hashed, passwordChangedAt: new Date() } });
            await prisma.session.deleteMany({ where: { userId: req.user.id } });

            res.json({ message: 'Senha alterada com sucesso' });
        } catch (e: any) {
            res.status(500).json({ error: e.message });
        }
    }

    static async uploadPhoto(req: any, res: Response) {
        try {
            if (!req.file) return res.status(400).json({ error: 'Nenhuma foto enviada' });
            const photoUrl = `/uploads/${req.file.filename}`;
            await prisma.user.update({ where: { id: req.user.id }, data: { profilePhoto: photoUrl } });
            res.json({ photoUrl });
        } catch (e: any) {
            res.status(500).json({ error: e.message });
        }
    }

    static async acceptTerms(req: any, res: Response) {
        try {
            await prisma.termsAcceptance.create({
                data: {
                    userId: req.user.id,
                    termsVersion: '1.0',
                    ipAddress: req.ip || req.connection.remoteAddress
                }
            });
            res.json({ message: 'Termos aceitos' });
        } catch (e: any) {
            res.status(500).json({ error: e.message });
        }
    }

    static async getSecurity(req: any, res: Response) {
        try {
            const [devices, sessions, recentLogins] = await Promise.all([
                prisma.device.findMany({
                    where: { userId: req.user.id },
                    orderBy: { lastUsedAt: 'desc' }
                }),
                prisma.session.findMany({
                    where: { userId: req.user.id },
                    orderBy: { createdAt: 'desc' }
                }),
                prisma.auditLog.findMany({
                    where: { userId: req.user.id, action: 'login' },
                    orderBy: { createdAt: 'desc' },
                    take: 10,
                    select: {
                        id: true,
                        createdAt: true,
                        ipAddress: true,
                        userAgent: true,
                        status: true
                    }
                })
            ]);

            res.json({ devices, sessions, recentLogins });
        } catch (e: any) {
            res.status(500).json({ error: e.message });
        }
    }

    static async deleteDevice(req: any, res: Response) {
        try {
            const { id } = req.params;
            const device = await prisma.device.findUnique({ where: { id } });
            if (!device || device.userId !== req.user.id) {
                return res.status(404).json({ error: 'Dispositivo não encontrado' });
            }
            await prisma.device.delete({ where: { id } });
            res.json({ message: 'Dispositivo removido com sucesso' });
        } catch (e: any) {
            res.status(500).json({ error: e.message });
        }
    }

    static async trustDevice(req: any, res: Response) {
        try {
            const { id } = req.params;
            const device = await prisma.device.findUnique({ where: { id } });
            if (!device || device.userId !== req.user.id) {
                return res.status(404).json({ error: 'Dispositivo não encontrado' });
            }
            await prisma.device.update({ where: { id }, data: { trusted: true } });
            res.json({ message: 'Dispositivo marcado como confiável' });
        } catch (e: any) {
            res.status(500).json({ error: e.message });
        }
    }

    static async deleteSession(req: any, res: Response) {
        try {
            const { id } = req.params;
            const session = await prisma.session.findUnique({ where: { id } });
            if (!session || session.userId !== req.user.id) {
                return res.status(404).json({ error: 'Sessão não encontrada' });
            }
            await prisma.session.delete({ where: { id } });
            res.json({ message: 'Sessão revogada com sucesso' });
        } catch (e: any) {
            res.status(500).json({ error: e.message });
        }
    }
}
