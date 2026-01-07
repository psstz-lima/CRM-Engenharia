import { Router } from 'express';
import { ContractController } from '../controllers/contract.controller';
import { AddendumController } from '../controllers/addendum.controller';
import { MeasurementController } from '../controllers/measurement.controller';
import { PhotoController } from '../controllers/photo.controller';
import { ExcelService } from '../services/excel.service';
import { authMiddleware } from '../middlewares/auth.middleware';
import { checkPermission, checkAnyPermission } from '../middlewares/permissions.middleware';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = Router();

// Multer config for Excel imports
const uploadExcel = multer({ storage: multer.memoryStorage() });

// Multer config for photo uploads
const uploadsDir = path.join(__dirname, '../../uploads/measurements');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

const photoStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, `photo-${uniqueSuffix}${ext}`);
    }
});

const uploadPhotos = multer({
    storage: photoStorage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Tipo de arquivo não permitido. Use JPG, PNG, WebP ou GIF.'));
        }
    }
});

router.use(authMiddleware);

// --- CONTRATOS ---
router.get('/', checkPermission('contracts_view'), ContractController.list);
router.get('/:id', checkPermission('contracts_view'), ContractController.getById);
router.post('/', checkPermission('contracts_create'), ContractController.create);
router.delete('/:id', checkPermission('contracts_delete'), ContractController.delete);

// --- ITENS DE CONTRATO ---
router.put('/items/reorder', checkPermission('contracts_edit'), ContractController.reorderItems);
router.post('/:contractId/items', checkPermission('contracts_edit'), ContractController.addItem);
router.put('/items/:id', checkPermission('contracts_edit'), ContractController.updateItem);
router.delete('/items/:id', checkPermission('contracts_edit'), ContractController.deleteItem);

// --- IMPORT/EXPORT ---
router.get('/template/download', checkPermission('contracts_view'), ContractController.downloadTemplate);
router.get('/:id/export', checkPermission('reports_export'), ContractController.exportExcel);
router.post('/:id/import', checkPermission('contracts_edit'), uploadExcel.single('file'), ContractController.importExcel);

// --- ADITIVOS ---
router.get('/:contractId/addendums', checkPermission('addendums_view'), AddendumController.list);
router.get('/:contractId/vigent-items', checkPermission('contracts_view'), AddendumController.getVigentItems);
router.post('/:contractId/addendums', checkPermission('addendums_create'), AddendumController.create);
router.get('/addendums/:id', checkPermission('addendums_view'), AddendumController.getById);
router.post('/addendums/:addendumId/operations', checkPermission('addendums_create'), AddendumController.addOperation);
router.delete('/addendums/operations/:operationId', checkPermission('addendums_create'), AddendumController.removeOperation);
router.post('/addendums/:id/approve', checkPermission('addendums_approve'), AddendumController.approve);
router.post('/addendums/:id/cancel', checkPermission('addendums_approve'), AddendumController.cancel);

// --- MEDIÇÕES ---
router.get('/:contractId/measurements', checkPermission('measurements_view'), MeasurementController.list);
router.post('/:contractId/measurements', checkPermission('measurements_create'), MeasurementController.create);
router.get('/measurements/:id', checkPermission('measurements_view'), MeasurementController.getById);
router.post('/measurements/:id/items', checkPermission('measurements_edit'), MeasurementController.updateItem);
router.get('/measurements/:id/balances', checkPermission('measurements_view'), MeasurementController.getBalances);
router.post('/measurements/:id/close', checkPermission('measurements_close'), MeasurementController.close);
router.post('/measurements/:id/reopen', checkPermission('measurements_edit'), MeasurementController.reopen);
router.get('/measurements/:id/revisions', checkPermission('measurements_view'), MeasurementController.listRevisions);

// --- EXPORTAÇÃO DE MEDIÇÃO ---
router.get('/measurements/:id/export', checkPermission('reports_export'), async (req, res) => {
    try {
        const { id } = req.params;
        const buffer = await ExcelService.generateMeasurementExcel(id);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=medicao-${id}.xlsx`);
        res.send(buffer);
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

// --- MEMÓRIA DE CÁLCULO ---
router.post('/measurements/:id/memories', checkPermission('measurements_edit'), MeasurementController.addMemory);
router.delete('/measurements/memories/:memoryId', checkPermission('measurements_edit'), MeasurementController.removeMemory);
router.get('/measurements/:id/items/:itemId', checkPermission('measurements_view'), MeasurementController.getItem);
router.put('/measurements/:id/items/:itemId/config', checkPermission('measurements_edit'), MeasurementController.updateItemConfig);
router.get('/measurements/:id/items/:itemId/memories', checkPermission('measurements_view'), MeasurementController.listMemories);

// --- FOTOS DE MEDIÇÃO ---
router.post('/measurements/:id/items/:itemId/photos', checkPermission('measurements_edit'), uploadPhotos.array('photos', 10), PhotoController.upload);
router.get('/measurements/:id/items/:itemId/photos', checkPermission('measurements_view'), PhotoController.list);
router.delete('/measurements/photos/:photoId', checkPermission('measurements_edit'), PhotoController.delete);
router.patch('/measurements/photos/:photoId', checkPermission('measurements_edit'), PhotoController.updateDescription);

export default router;
