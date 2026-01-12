import { Router } from 'express';
import { DocumentController, documentUpload } from '../controllers/document.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

router.use(authMiddleware);

// Categorias
router.get('/categories', DocumentController.listCategories);

// Documentos (Geral)
router.get('/', DocumentController.list);

// Documentos por contrato
router.get('/contract/:contractId', DocumentController.list);
router.get('/contract/:contractId/stats', DocumentController.getStats);

// CRUD de documentos
router.get('/:id', DocumentController.getById);
router.get('/:id/download', DocumentController.download);
router.delete('/:id', DocumentController.delete);

// Upload
router.post('/', (req, res, next) => {
    documentUpload(req, res, (err) => {
        if (err) return res.status(400).json({ error: err.message });
        next();
    });
}, DocumentController.upload);

// Nova revisão
router.post('/:id/revision', (req, res, next) => {
    documentUpload(req, res, (err) => {
        if (err) return res.status(400).json({ error: err.message });
        next();
    });
}, DocumentController.uploadRevision);

// Atualizar status
router.patch('/:id/status', DocumentController.updateStatus);

export default router;
