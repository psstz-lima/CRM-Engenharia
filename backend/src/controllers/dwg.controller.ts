import { Request, Response } from 'express';
import prisma from '../config/database';
import { dwgService } from '../services/dwg.service';

export class DWGController {
    /**
     * GET /api/documents/:id/svg
     * Retorna o SVG convertido do documento
     */
    async getSvg(req: Request, res: Response) {
        try {
            const { id } = req.params;

            const document = await prisma.projectDocument.findUnique({
                where: { id }
            });

            if (!document) {
                return res.status(404).json({ message: 'Documento não encontrado' });
            }

            // Verificar se é DWG ou DXF
            const mimeType = document.mimeType.toLowerCase();
            const fileName = document.fileName.toLowerCase();

            if (!mimeType.includes('dwg') && !mimeType.includes('dxf') &&
                !fileName.endsWith('.dwg') && !fileName.endsWith('.dxf')) {
                return res.status(400).json({ message: 'Documento não é um arquivo DWG/DXF' });
            }

            const result = await dwgService.getSvg(id);

            if (!result) {
                return res.status(500).json({ message: 'Erro ao converter documento' });
            }

            res.json({
                svg: result.svg,
                layers: result.layers
            });
        } catch (error: any) {
            console.error('Erro ao obter SVG:', error);
            res.status(500).json({ message: error.message });
        }
    }

    /**
     * GET /api/documents/:id/layers
     * Retorna a lista de layers do documento
     */
    async getLayers(req: Request, res: Response) {
        try {
            const { id } = req.params;

            const result = await dwgService.getSvg(id);

            if (!result) {
                return res.status(404).json({ message: 'Documento não encontrado ou não conversível' });
            }

            res.json({ layers: result.layers });
        } catch (error: any) {
            console.error('Erro ao obter layers:', error);
            res.status(500).json({ message: error.message });
        }
    }

    /**
     * GET /api/documents/:id/annotations
     * Retorna anotações do documento
     */
    async getAnnotations(req: Request, res: Response) {
        try {
            const { id } = req.params;

            const annotations = await prisma.documentAnnotation.findMany({
                where: { documentId: id },
                orderBy: { createdAt: 'desc' }
            });

            res.json(annotations);
        } catch (error: any) {
            console.error('Erro ao obter anotações:', error);
            res.status(500).json({ message: error.message });
        }
    }

    /**
     * POST /api/documents/:id/annotations
     * Criar nova anotação
     */
    async createAnnotation(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { type, geometry, text, color } = req.body;
            const user = (req as any).user;

            const annotation = await prisma.documentAnnotation.create({
                data: {
                    documentId: id,
                    type,
                    geometry,
                    text,
                    color: color || '#ff0000',
                    createdById: user?.id,
                    createdByName: user?.fullName
                }
            });

            res.status(201).json(annotation);
        } catch (error: any) {
            console.error('Erro ao criar anotação:', error);
            res.status(500).json({ message: error.message });
        }
    }

    /**
     * PUT /api/documents/:id/annotations/:annotationId
     * Atualizar anotação
     */
    async updateAnnotation(req: Request, res: Response) {
        try {
            const { annotationId } = req.params;
            const { geometry, text, color } = req.body;

            const annotation = await prisma.documentAnnotation.update({
                where: { id: annotationId },
                data: {
                    geometry,
                    text,
                    color
                }
            });

            res.json(annotation);
        } catch (error: any) {
            console.error('Erro ao atualizar anotação:', error);
            res.status(500).json({ message: error.message });
        }
    }

    /**
     * DELETE /api/documents/:id/annotations/:annotationId
     * Deletar anotação
     */
    async deleteAnnotation(req: Request, res: Response) {
        try {
            const { annotationId } = req.params;

            await prisma.documentAnnotation.delete({
                where: { id: annotationId }
            });

            res.status(204).send();
        } catch (error: any) {
            console.error('Erro ao deletar anotação:', error);
            res.status(500).json({ message: error.message });
        }
    }

    /**
     * POST /api/dwg/cleanup-cache
     * Limpar cache de arquivos convertidos
     */
    async cleanupCache(req: Request, res: Response) {
        try {
            const { maxAgeDays = 7 } = req.body;
            const cleaned = await dwgService.cleanupCache(maxAgeDays);

            res.json({
                message: `Cache limpo com sucesso`,
                filesRemoved: cleaned
            });
        } catch (error: any) {
            console.error('Erro ao limpar cache:', error);
            res.status(500).json({ message: error.message });
        }
    }
}

export const dwgController = new DWGController();
