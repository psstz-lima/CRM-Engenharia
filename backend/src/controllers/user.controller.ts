import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import prisma from '../config/database';
import { config } from '../config';
import { sendEmail } from '../services/email.service';

export class UserController {
    static async list(req: Request, res: Response) {
        try {
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 1000;
            const skip = (page - 1) * limit;

            const [users, total] = await Promise.all([
                prisma.user.findMany({
                    include: { company: true, role: true },
                    skip,
                    take: limit,
                    orderBy: { createdAt: 'desc' }
                }),
                prisma.user.count()
            ]);

            res.json({
                data: users,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit)
                }
            });
        } catch (e: any) {
            res.status(500).json({ error: e.message });
        }
    }

    static async invite(req: Request, res: Response) {
        try {
            const { email, fullName, companyId, roleId } = req.body;

            const existing = await prisma.user.findUnique({ where: { email } });
            if (existing) return res.status(400).json({ error: 'Email já cadastrado' });

            const tempPassword = crypto.randomBytes(8).toString('hex');
            const hashed = await bcrypt.hash(tempPassword, config.security.bcryptRounds);

            const user = await prisma.user.create({
                data: {
                    email,
                    fullName,
                    companyId,
                    roleId,
                    password: hashed,
                    mustChangePassword: true
                },
                include: { company: true, role: true },
            });

            const token = crypto.randomBytes(32).toString('hex');
            await prisma.passwordReset.create({
                data: { userId: user.id, token, expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000) },
            });

            const link = `${config.frontendUrl}/reset-password?token=${token}`;

            await sendEmail(
                user.email,
                'Convite para acessar o CRM Engenharia',
                `<p>Olá ${fullName},</p>
                 <p>Você foi convidado para acessar o sistema.</p>
                 <p>Clique <a href="${link}">aqui</a> para definir sua senha e acessar.</p>
                 <p>Este link é válido por 48 horas.</p>`
            );

            res.json({ message: 'Convite enviado com sucesso', user });
        } catch (e: any) {
            res.status(500).json({ error: e.message });
        }
    }

    static async create(req: Request, res: Response) {
        try {
            const { email, fullName, companyId, roleId, password } = req.body;
            const hashed = await bcrypt.hash(password, config.security.bcryptRounds);
            const user = await prisma.user.create({
                data: { email, fullName, companyId, roleId, password: hashed },
                include: { company: true, role: true },
            });
            res.json(user);
        } catch (e: any) {
            res.status(500).json({ error: e.message });
        }
    }

    static async update(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { fullName, email, companyId, roleId, isActive } = req.body;

            const data: any = {};
            if (fullName !== undefined) data.fullName = fullName;
            if (email !== undefined) data.email = email;
            if (companyId !== undefined) data.companyId = companyId;
            if (roleId !== undefined) data.roleId = roleId;
            if (isActive !== undefined) data.isActive = isActive;

            const user = await prisma.user.update({
                where: { id },
                data,
                include: { company: true, role: true }
            });
            res.json(user);
        } catch (e: any) {
            res.status(500).json({ error: e.message });
        }
    }

    static async resetUserPassword(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { newPassword } = req.body;

            if (!newPassword || newPassword.length < 6) {
                return res.status(400).json({ error: 'Senha deve ter no mínimo 6 caracteres' });
            }

            const hashed = await bcrypt.hash(newPassword, config.security.bcryptRounds);
            await prisma.user.update({
                where: { id },
                data: { password: hashed, passwordChangedAt: null, mustChangePassword: true }
            });

            await prisma.session.deleteMany({ where: { userId: id } });

            res.json({ message: 'Senha redefinida com sucesso. Usuário deverá trocar no próximo login.' });
        } catch (e: any) {
            res.status(500).json({ error: e.message });
        }
    }

    static async delete(req: Request, res: Response) {
        try {
            const { id } = req.params;
            await prisma.user.update({ where: { id }, data: { isActive: false } });
            res.json({ message: 'Usuário desativado' });
        } catch (e: any) {
            res.status(500).json({ error: e.message });
        }
    }
}
