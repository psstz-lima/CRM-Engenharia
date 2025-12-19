import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import prisma from '../config/database';

export const authMiddleware = async (req: any, res: Response, next: NextFunction) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        if (!token) return res.status(401).json({ error: 'Token não fornecido' });
        const decoded: any = jwt.verify(token, (config.jwt.secret as string));
        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            include: { company: true, role: true },
        });
        if (!user || !user.isActive) return res.status(401).json({ error: 'Usuário inativo' });
        req.user = user;
        next();
    } catch {
        res.status(401).json({ error: 'Token inválido' });
    }
};

export const masterMiddleware = (req: any, res: Response, next: NextFunction) => {
    if (!req.user?.isMaster) return res.status(403).json({ error: 'Acesso negado' });
    next();
};
