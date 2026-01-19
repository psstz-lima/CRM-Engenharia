import { Request, Response } from 'express';
import prisma from '../config/database';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Storage configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const targetType = req.body.targetType || 'general';
        const targetId = req.body.targetId || 'misc';
        const uploadDir = path.resolve(__dirname, '../../uploads/attachments', targetType, targetId);

        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, `${path.basename(file.originalname, ext)}-${uniqueSuffix}${ext}`);
    }
});

export const attachmentUpload = multer({
    storage,
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
    fileFilter: (req, file, cb) => {
        // Allowed file types
        const allowedMimes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'image/jpeg',
            'image/png',
            'image/gif',
            'application/zip',
            'application/x-rar-compressed',
            'text/plain',
            'application/vnd.dwg',
            'application/acad'
        ];

        if (allowedMimes.includes(file.mimetype) || file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error(`Tipo de arquivo não permitido: ${file.mimetype}`));
        }
    }
}).array('files', 10); // Max 10 files at once

export class AttachmentController {
    // List attachments for a target
    static async list(req: Request, res: Response) {
        try {
            const { targetType, targetId } = req.params;

            const attachments = await prisma.attachment.findMany({
                where: { targetType, targetId },
                orderBy: { createdAt: 'desc' }
            });

            res.json(attachments);
        } catch (e: any) {
            res.status(500).json({ error: e.message });
        }
    }

    // Upload attachments
    static async upload(req: any, res: Response) {
        try {
            const { targetType, targetId, description } = req.body;
            const files = req.files as Express.Multer.File[];

            if (!files || files.length === 0) {
                return res.status(400).json({ error: 'Nenhum arquivo enviado' });
            }

            if (!targetType || !targetId) {
                return res.status(400).json({ error: 'targetType e targetId são obrigatórios' });
            }
            const userId = req.user?.id;
            const userName = req.user?.fullName || 'Usuário';

            const attachments = await Promise.all(files.map(async (file) => {
                return prisma.attachment.create({
                    data: {
                        targetType,
                        targetId,
                        filename: file.originalname,
                        storedName: file.filename,
                        path: file.path,
                        mimeType: file.mimetype,
                        size: file.size,
                        description: description || null,
                        uploadedById: userId,
                        uploadedByName: userName
                    }
                });
            }));

            res.status(201).json(attachments);
        } catch (e: any) {
            console.error('Upload error:', e);
            res.status(500).json({ error: e.message });
        }
    }

    // Download attachment
    static async download(req: Request, res: Response) {
        try {
            const { id } = req.params;

            const attachment = await prisma.attachment.findUnique({ where: { id } });
            if (!attachment) {
                return res.status(404).json({ error: 'Anexo não encontrado' });
            }

            if (!fs.existsSync(attachment.path)) {
                return res.status(404).json({ error: 'Arquivo não encontrado no servidor' });
            }

            res.setHeader('Content-Type', attachment.mimeType);
            res.setHeader('Content-Disposition', `attachment; filename="${attachment.filename}"`);

            const fileStream = fs.createReadStream(attachment.path);
            fileStream.pipe(res);
        } catch (e: any) {
            res.status(500).json({ error: e.message });
        }
    }

    // Delete attachment
    static async delete(req: Request, res: Response) {
        try {
            const { id } = req.params;

            const attachment = await prisma.attachment.findUnique({ where: { id } });
            if (!attachment) {
                return res.status(404).json({ error: 'Anexo não encontrado' });
            }

            // Delete file from disk
            if (fs.existsSync(attachment.path)) {
                fs.unlinkSync(attachment.path);
            }

            // Delete from database
            await prisma.attachment.delete({ where: { id } });

            res.json({ message: 'Anexo excluído com sucesso' });
        } catch (e: any) {
            res.status(500).json({ error: e.message });
        }
    }

    // Get attachment counts by target
    static async getCounts(req: Request, res: Response) {
        try {
            const { targetType, targetIds } = req.body;

            const counts = await prisma.attachment.groupBy({
                by: ['targetId'],
                where: {
                    targetType,
                    targetId: { in: targetIds }
                },
                _count: { id: true }
            });

            const result: Record<string, number> = {};
            counts.forEach(c => {
                result[c.targetId] = c._count.id;
            });

            res.json(result);
        } catch (e: any) {
            res.status(500).json({ error: e.message });
        }
    }
}


