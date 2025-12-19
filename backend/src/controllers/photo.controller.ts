import { Request, Response } from 'express';
import prisma from '../config/database';
import path from 'path';
import fs from 'fs';

export class PhotoController {
    // Upload photos for a measurement item
    static async upload(req: any, res: Response) {
        try {
            const { id, itemId } = req.params; // id = measurementId, itemId = contractItemId
            const files = req.files as Express.Multer.File[];
            const { description, photoDate, location } = req.body;

            if (!files || files.length === 0) {
                return res.status(400).json({ error: 'Nenhum arquivo enviado' });
            }

            // Get measurement and verify it's in DRAFT
            const measurement = await prisma.measurement.findUnique({ where: { id } });
            if (!measurement) {
                return res.status(404).json({ error: 'Medição não encontrada' });
            }
            if (measurement.status !== 'DRAFT') {
                // Delete uploaded files since we can't save them
                files.forEach(f => fs.unlinkSync(f.path));
                return res.status(400).json({ error: 'Medição fechada. Não é possível adicionar fotos.' });
            }

            // Find or create measurement item
            let measurementItem = await prisma.measurementItem.findUnique({
                where: { measurementId_contractItemId: { measurementId: id, contractItemId: itemId } }
            });

            if (!measurementItem) {
                // Create measurement item if it doesn't exist
                const contractItem = await prisma.contractItem.findUnique({ where: { id: itemId } });
                if (!contractItem) {
                    files.forEach(f => fs.unlinkSync(f.path));
                    return res.status(404).json({ error: 'Item de contrato não encontrado' });
                }

                measurementItem = await prisma.measurementItem.create({
                    data: {
                        measurementId: id,
                        contractItemId: itemId,
                        measuredQuantity: 0,
                        accumulatedQuantity: 0,
                        currentPrice: contractItem.unitPrice || 0
                    }
                });
            }

            // Create photo records
            const photos = await Promise.all(files.map(async (file) => {
                return prisma.measurementPhoto.create({
                    data: {
                        measurementItemId: measurementItem!.id,
                        filename: file.originalname,
                        path: file.path.replace(/\\/g, '/'),
                        mimeType: file.mimetype,
                        size: file.size,
                        description: description || null,
                        photoDate: photoDate ? new Date(photoDate) : null,
                        location: location || null,
                        uploadedBy: req.user?.id || null
                    }
                });
            }));

            return res.status(201).json(photos);
        } catch (e: any) {
            console.error(e);
            return res.status(500).json({ error: e.message });
        }
    }

    // List photos for a measurement item
    static async list(req: Request, res: Response) {
        try {
            const { id, itemId } = req.params; // id = measurementId, itemId = contractItemId

            const measurementItem = await prisma.measurementItem.findUnique({
                where: { measurementId_contractItemId: { measurementId: id, contractItemId: itemId } },
                include: { photos: { orderBy: { createdAt: 'desc' } } }
            });

            if (!measurementItem) {
                return res.json([]);
            }

            return res.json(measurementItem.photos);
        } catch (e: any) {
            return res.status(500).json({ error: e.message });
        }
    }

    // Delete a photo
    static async delete(req: any, res: Response) {
        try {
            const { photoId } = req.params;

            const photo = await prisma.measurementPhoto.findUnique({
                where: { id: photoId },
                include: { measurementItem: { include: { measurement: true } } }
            });

            if (!photo) {
                return res.status(404).json({ error: 'Foto não encontrada' });
            }

            // Check if measurement is in DRAFT
            if (photo.measurementItem.measurement.status !== 'DRAFT') {
                return res.status(400).json({ error: 'Medição fechada. Não é possível excluir fotos.' });
            }

            // Delete file from disk
            try {
                if (fs.existsSync(photo.path)) {
                    fs.unlinkSync(photo.path);
                }
            } catch (fileError) {
                console.error('Error deleting file:', fileError);
            }

            // Delete from database
            await prisma.measurementPhoto.delete({ where: { id: photoId } });

            return res.status(204).send();
        } catch (e: any) {
            return res.status(500).json({ error: e.message });
        }
    }

    // Update photo metadata (description, date, location)
    static async updateDescription(req: Request, res: Response) {
        try {
            const { photoId } = req.params;
            const { description, photoDate, location } = req.body;

            const photo = await prisma.measurementPhoto.findUnique({
                where: { id: photoId },
                include: { measurementItem: { include: { measurement: true } } }
            });

            if (!photo) {
                return res.status(404).json({ error: 'Foto não encontrada' });
            }

            if (photo.measurementItem.measurement.status !== 'DRAFT') {
                return res.status(400).json({ error: 'Medição fechada. Não é possível editar.' });
            }

            const updateData: any = {};
            if (description !== undefined) updateData.description = description;
            if (photoDate !== undefined) updateData.photoDate = photoDate ? new Date(photoDate) : null;
            if (location !== undefined) updateData.location = location;

            const updated = await prisma.measurementPhoto.update({
                where: { id: photoId },
                data: updateData
            });

            return res.json(updated);
        } catch (e: any) {
            return res.status(500).json({ error: e.message });
        }
    }
}
