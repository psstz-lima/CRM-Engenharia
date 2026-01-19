import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import prisma from '../config/database';
import { config } from '../config';
import { sendEmail } from '../services/email.service';

export class AuthController {
    static async login(req: Request, res: Response) {
        console.log('Login attempt received:', req.body.email);
        try {
            const { email, password } = req.body;
            if (!email || !password) {
                return res.status(400).json({ error: 'Email e senha são obrigatórios' });
            }
            const user = await prisma.user.findUnique({ where: { email }, include: { company: true, role: true } });
            if (!user) return res.status(401).json({ error: 'Credenciais inválidas' });

            if (user.lockedUntil && user.lockedUntil > new Date()) {
                return res.status(403).json({ error: 'Conta bloqueada temporariamente' });
            }

            const valid = await bcrypt.compare(password, user.password);
            if (!valid) {
                await prisma.user.update({
                    where: { id: user.id },
                    data: {
                        loginAttempts: user.loginAttempts + 1,
                        lockedUntil: user.loginAttempts + 1 >= config.security.maxLoginAttempts
                            ? new Date(Date.now() + config.security.lockoutDuration * 1000)
                            : null,
                    },
                });
                return res.status(401).json({ error: 'Credenciais inválidas' });
            }

            if (!user.isActive) return res.status(403).json({ error: 'Conta desativada' });

            await prisma.user.update({
                where: { id: user.id },
                data: { loginAttempts: 0, lockedUntil: null, lastLogin: new Date() },
            });

            const accessToken = jwt.sign({ userId: user.id, email: user.email }, (config.jwt.secret as string), {
                expiresIn: config.jwt.accessExpiry as any,
            });
            const refreshToken = jwt.sign({ userId: user.id }, (config.jwt.secret as string), {
                expiresIn: config.jwt.refreshExpiry as any,
            });

            await prisma.session.create({
                data: {
                    userId: user.id,
                    refreshToken,
                    ipAddress: req.ip,
                    userAgent: req.get('user-agent'),
                    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                },
            });

            // Device Detection
            const userAgent = req.get('user-agent') || 'Unknown';
            const ip = req.ip || 'Unknown';
            const deviceFingerprint = crypto.createHash('sha256').update(userAgent + ip).digest('hex');

            const existingDevice = await prisma.device.findUnique({
                where: { userId_fingerprint: { userId: user.id, fingerprint: deviceFingerprint } }
            });

            if (!existingDevice) {
                await prisma.device.create({
                    data: {
                        userId: user.id,
                        fingerprint: deviceFingerprint,
                        name: userAgent.substring(0, 50),
                    }
                });

                await sendEmail(
                    user.email,
                    'Novo Dispositivo Detectado',
                    `<p>Um novo dispositivo foi utilizado para acessar sua conta.</p>
                     <p><strong>Dispositivo:</strong> ${userAgent}</p>
                     <p><strong>IP:</strong> ${ip}</p>
                     <p>Se não foi você, recomendamos que altere sua senha imediatamente.</p>`
                );
            } else {
                await prisma.device.update({
                    where: { id: existingDevice.id },
                    data: { lastUsedAt: new Date() }
                });
            }

            await prisma.auditLog.create({
                data: {
                    userId: user.id,
                    action: 'login',
                    module: 'auth',
                    status: 'SUCCESS',
                    ipAddress: ip,
                    userAgent: userAgent,
                },
            });

            res.json({
                accessToken,
                refreshToken,
                user: {
                    id: user.id,
                    email: user.email,
                    fullName: user.fullName,
                    profilePhoto: user.profilePhoto,
                    isMaster: user.isMaster,
                    company: { id: user.company?.id, name: user.company?.name },
                    role: { id: user.role?.id, name: user.role?.name },
                    preferences: user.preferences,
                    termsAccepted: !!(await prisma.termsAcceptance.findFirst({ where: { userId: user.id, termsVersion: '1.0' } }))
                },
            });
        } catch (e: any) {
            res.status(500).json({ error: e.message });
        }
    }

    static async loginMaster(req: Request, res: Response) {
        try {
            console.log('Login Master Attempt:', req.body);
            const { email, password } = req.body;
            if (!email || !password) {
                return res.status(400).json({ error: 'Email e senha são obrigatórios' });
            }
            const user = await prisma.user.findUnique({ where: { email }, include: { company: true, role: true } });
            console.log('User found:', user?.email, 'isMaster:', user?.isMaster);
            if (!user || !user.isMaster) return res.status(403).json({ error: 'Acesso negado: Usuário não existe ou não é Master' });

            const valid = await bcrypt.compare(password, user.password);
            if (!valid) return res.status(401).json({ error: 'Credenciais inválidas' });
            if (!user.isActive) return res.status(403).json({ error: 'Conta desativada' });

            const accessToken = jwt.sign({ userId: user.id, email: user.email, isMaster: true }, (config.jwt.secret as string), {
                expiresIn: config.jwt.accessExpiry as any,
            });
            const refreshToken = jwt.sign({ userId: user.id }, (config.jwt.secret as string), { expiresIn: config.jwt.refreshExpiry as any });

            await prisma.session.create({
                data: {
                    userId: user.id,
                    refreshToken,
                    ipAddress: req.ip,
                    userAgent: req.get('user-agent'),
                    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                },
            });

            res.json({
                accessToken,
                refreshToken,
                user: {
                    id: user.id,
                    email: user.email,
                    fullName: user.fullName,
                    isMaster: user.isMaster,
                    company: { id: user.company?.id, name: user.company?.name },
                    role: { id: user.role?.id, name: user.role?.name },
                    preferences: user.preferences,
                    termsAccepted: !!(await prisma.termsAcceptance.findFirst({ where: { userId: user.id, termsVersion: '1.0' } }))
                },
            });
        } catch (e: any) {
            res.status(500).json({ error: e.message });
        }
    }

    static async refresh(req: Request, res: Response) {
        try {
            const { refreshToken } = req.body;
            if (!refreshToken) {
                return res.status(400).json({ error: 'Refresh token não informado' });
            }
            const session = await prisma.session.findUnique({
                where: { refreshToken },
                include: { user: { include: { company: true, role: true } } }
            });

            if (!session || session.expiresAt < new Date()) {
                return res.status(401).json({ error: 'Sessão expirada' });
            }

            const newAccessToken = jwt.sign(
                { userId: session.user.id, email: session.user.email },
                config.jwt.secret as string,
                { expiresIn: config.jwt.accessExpiry as any }
            );

            const newRefreshToken = jwt.sign(
                { userId: session.user.id },
                config.jwt.secret as string,
                { expiresIn: config.jwt.refreshExpiry as any }
            );

            await prisma.session.update({
                where: { id: session.id },
                data: {
                    refreshToken: newRefreshToken,
                    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
                }
            });

            res.json({
                accessToken: newAccessToken,
                refreshToken: newRefreshToken
            });
        } catch (e: any) {
            res.status(500).json({ error: e.message });
        }
    }

    static async logout(req: Request, res: Response) {
        try {
            const { refreshToken } = req.body;
            await prisma.session.delete({ where: { refreshToken } });
            res.json({ message: 'Logout realizado' });
        } catch (e: any) {
            res.status(500).json({ error: e.message });
        }
    }

    static async logoutAll(req: any, res: Response) {
        try {
            await prisma.session.deleteMany({ where: { userId: req.user.id } });
            res.json({ message: 'Desconectado de todos os dispositivos' });
        } catch (e: any) {
            res.status(500).json({ error: e.message });
        }
    }

    static async forgotPassword(req: Request, res: Response) {
        try {
            const { email } = req.body;
            if (!email) {
                return res.status(400).json({ error: 'Email não informado' });
            }
            const user = await prisma.user.findUnique({ where: { email } });
            if (!user) return res.json({ message: 'Se o email existir, um link será enviado' });

            const token = crypto.randomBytes(32).toString('hex');
            await prisma.passwordReset.create({
                data: { userId: user.id, token, expiresAt: new Date(Date.now() + 15 * 60 * 1000) },
            });

            const link = `${config.frontendUrl}/reset-password?token=${token}`;
            await sendEmail(
                user.email,
                'Recuperação de Senha',
                `<p>Clique <a href="${link}">aqui</a> para redefinir sua senha. Link válido por 15 minutos.</p>`
            );

            res.json({ message: 'Se o email existir, um link será enviado' });
        } catch (e: any) {
            res.status(500).json({ error: e.message });
        }
    }

    static async resetPassword(req: Request, res: Response) {
        try {
            const { token, newPassword } = req.body;
            if (!token || !newPassword) {
                return res.status(400).json({ error: 'Token e nova senha são obrigatórios' });
            }
            const reset = await prisma.passwordReset.findUnique({ where: { token } });
            if (!reset || reset.usedAt || reset.expiresAt < new Date()) {
                return res.status(400).json({ error: 'Token inválido ou expirado' });
            }

            const hashedPassword = await bcrypt.hash(newPassword, config.security.bcryptRounds);
            await prisma.user.update({
                where: { id: reset.userId },
                data: { password: hashedPassword, passwordChangedAt: new Date() },
            });
            await prisma.passwordReset.update({ where: { id: reset.id }, data: { usedAt: new Date() } });
            await prisma.session.deleteMany({ where: { userId: reset.userId } });

            res.json({ message: 'Senha redefinida com sucesso' });
        } catch (e: any) {
            res.status(500).json({ error: e.message });
        }
    }
}



