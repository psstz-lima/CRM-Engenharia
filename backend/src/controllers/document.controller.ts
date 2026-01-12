import { Request, Response } from 'express';
import prisma from '../config/database';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Storage configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const contractId = req.body.contractId || 'general';
        const uploadDir = path.resolve(__dirname, '../../uploads/documents', contractId);

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

export const documentUpload = multer({
    storage,
    limits: { fileSize: 100 * 1024 * 1024 }, // 100MB
    fileFilter: (req, file, cb) => {
        const allowedMimes = [
            'application/pdf',
            'image/vnd.dwg',
            'application/acad',
            'application/x-autocad',
            'application/x-dwg',
            'application/dxf',
            'image/vnd.dxf',
            'image/jpeg',
            'image/png',
            'image/tiff'
        ];

        const ext = path.extname(file.originalname).toLowerCase();
        const allowedExts = ['.pdf', '.dwg', '.dxf', '.jpg', '.jpeg', '.png', '.tif', '.tiff'];

        if (allowedExts.includes(ext)) {
            cb(null, true);
        } else {
            cb(new Error(`Tipo de arquivo não permitido: ${ext}`));
        }
    }
}).single('file');

export class DocumentController {
    // Listar documentos por contrato
    static async list(req: Request, res: Response) {
        try {
            const { contractId } = req.params;
            const { categoryId, status, search, contractId: queryContractId } = req.query;
            const effectiveContractId = contractId || (queryContractId as string);

            const where: any = {};
            if (effectiveContractId) where.contractId = effectiveContractId;
            if (categoryId) where.categoryId = categoryId;
            if (status) where.status = status;
            if (search) {
                where.OR = [
                    { code: { contains: search as string, mode: 'insensitive' } },
                    { title: { contains: search as string, mode: 'insensitive' } }
                ];
            }

            const documents = await prisma.projectDocument.findMany({
                where,
                include: {
                    category: true,
                    _count: { select: { versions: true, analyses: true } }
                },
                orderBy: [{ categoryId: 'asc' }, { code: 'asc' }]
            });

            res.json(documents);
        } catch (e: any) {
            res.status(500).json({ error: e.message });
        }
    }

    // Detalhes do documento
    static async getById(req: Request, res: Response) {
        try {
            const { id } = req.params;

            const document = await prisma.projectDocument.findUnique({
                where: { id },
                include: {
                    category: true,
                    contract: { select: { number: true, company: { select: { name: true } } } },
                    versions: { orderBy: { createdAt: 'desc' } },
                    analyses: { orderBy: { createdAt: 'desc' } },
                    annotations: true
                }
            });

            if (!document) {
                return res.status(404).json({ error: 'Documento não encontrado' });
            }

            res.json(document);
        } catch (e: any) {
            res.status(500).json({ error: e.message });
        }
    }

    // Upload de documento
    static async upload(req: any, res: Response) {
        console.log('--- UPLOAD DEBUG ---');
        console.log('Body Keys:', Object.keys(req.body));
        try {
            const { contractId, categoryId, code, title, description, author, format, scale } = req.body;
            const file = req.file;

            if (!file) {
                return res.status(400).json({ error: 'Nenhum arquivo enviado' });
            }

            if (!code || !title) {
                return res.status(400).json({ error: 'code e title são obrigatórios' });
            }

            // Verificar se código já existe para esse contrato
            const existing = await prisma.projectDocument.findFirst({
                where: {
                    contractId: contractId || null,
                    code
                }
            });

            if (existing) {
                return res.status(400).json({ error: 'Já existe um documento com este código neste contrato' });
            }

            const document = await prisma.projectDocument.create({
                data: {
                    contractId: contractId || null,
                    categoryId: categoryId || null,
                    code,
                    title,
                    description,
                    fileName: file.originalname,
                    storedName: file.filename,
                    filePath: file.path,
                    fileSize: file.size,
                    mimeType: file.mimetype,
                    author,
                    format,
                    scale,
                    uploadedById: req.user?.id,
                    uploadedByName: req.user?.fullName
                },
                include: { category: true }
            });

            res.status(201).json(document);
        } catch (e: any) {
            console.error('Upload error DETAILS:', e);
            res.status(500).json({ error: e.message || String(e) });
        }
    }

    // Nova revisão do documento
    static async uploadRevision(req: any, res: Response) {
        try {
            const { id } = req.params;
            const { changes } = req.body;
            const file = req.file;

            if (!file) {
                return res.status(400).json({ error: 'Nenhum arquivo enviado' });
            }

            const document = await prisma.projectDocument.findUnique({ where: { id } });
            if (!document) {
                return res.status(404).json({ error: 'Documento não encontrado' });
            }

            // Calcular próxima revisão
            const currentRev = parseInt(document.revision.replace('R', '')) || 0;
            const nextRev = `R${String(currentRev + 1).padStart(2, '0')}`;

            // Salvar versão anterior
            await prisma.documentVersion.create({
                data: {
                    documentId: id,
                    revision: document.revision,
                    fileName: document.fileName,
                    storedName: document.storedName,
                    filePath: document.filePath,
                    fileSize: document.fileSize,
                    changes: changes || 'Arquivo substituído',
                    uploadedById: req.user?.id,
                    uploadedByName: req.user?.fullName
                }
            });

            // Atualizar documento com nova revisão
            const updated = await prisma.projectDocument.update({
                where: { id },
                data: {
                    revision: nextRev,
                    revisionDate: new Date(),
                    fileName: file.originalname,
                    storedName: file.filename,
                    filePath: file.path,
                    fileSize: file.size,
                    mimeType: file.mimetype,
                    status: 'RECEIVED' // Reset status para nova análise
                },
                include: { category: true, versions: true }
            });

            res.json(updated);
        } catch (e: any) {
            res.status(500).json({ error: e.message });
        }
    }

    // Atualizar status do documento
    static async updateStatus(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { status } = req.body;

            const statusTimestamps: Record<string, string> = {
                'IN_ANALYSIS': 'analyzedAt',
                'APPROVED': 'approvedAt',
                'APPROVED_NOTES': 'approvedAt',
                'DISTRIBUTED': 'distributedAt',
                'RELEASED': 'releasedAt'
            };

            const updateData: any = { status };
            if (statusTimestamps[status]) {
                updateData[statusTimestamps[status]] = new Date();
            }

            const document = await prisma.projectDocument.update({
                where: { id },
                data: updateData
            });

            res.json(document);
        } catch (e: any) {
            res.status(500).json({ error: e.message });
        }
    }

    // Download do documento
    static async download(req: Request, res: Response) {
        try {
            const { id } = req.params;

            const document = await prisma.projectDocument.findUnique({ where: { id } });
            if (!document) {
                return res.status(404).json({ error: 'Documento não encontrado' });
            }

            if (!fs.existsSync(document.filePath)) {
                return res.status(404).json({ error: 'Arquivo não encontrado no servidor' });
            }

            res.setHeader('Content-Type', document.mimeType);
            res.setHeader('Content-Disposition', `attachment; filename="${document.fileName}"`);

            const fileStream = fs.createReadStream(document.filePath);
            fileStream.pipe(res);
        } catch (e: any) {
            res.status(500).json({ error: e.message });
        }
    }

    // Excluir documento
    static async delete(req: Request, res: Response) {
        try {
            const { id } = req.params;

            const document = await prisma.projectDocument.findUnique({
                where: { id },
                include: { versions: true }
            });

            if (!document) {
                return res.status(404).json({ error: 'Documento não encontrado' });
            }

            // Excluir arquivos físicos
            if (fs.existsSync(document.filePath)) {
                fs.unlinkSync(document.filePath);
            }
            for (const version of document.versions) {
                if (fs.existsSync(version.filePath)) {
                    fs.unlinkSync(version.filePath);
                }
            }

            await prisma.projectDocument.delete({ where: { id } });

            res.json({ message: 'Documento excluído com sucesso' });
        } catch (e: any) {
            res.status(500).json({ error: e.message });
        }
    }

    // Listar categorias
    static async listCategories(req: Request, res: Response) {
        try {
            const categories = await prisma.documentCategory.findMany({
                where: { isActive: true },
                orderBy: { orderIndex: 'asc' }
            });
            res.json(categories);
        } catch (e: any) {
            res.status(500).json({ error: e.message });
        }
    }

    // Estatísticas de documentos por contrato
    static async getStats(req: Request, res: Response) {
        try {
            const { contractId } = req.params;

            const [total, byStatus, byCategory] = await Promise.all([
                prisma.projectDocument.count({ where: { contractId } }),
                prisma.projectDocument.groupBy({
                    by: ['status'],
                    where: { contractId },
                    _count: true
                }),
                prisma.projectDocument.groupBy({
                    by: ['categoryId'],
                    where: { contractId },
                    _count: true
                })
            ]);

            res.json({
                total,
                byStatus: byStatus.reduce((acc, { status, _count }) => ({ ...acc, [status]: _count }), {}),
                byCategory
            });
        } catch (e: any) {
            res.status(500).json({ error: e.message });
        }
    }
}
