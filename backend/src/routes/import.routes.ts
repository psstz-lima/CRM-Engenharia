import { Router } from 'express';
import { ImportController, uploadMiddleware } from '../controllers/import.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { checkPermission } from '../middlewares/permissions.middleware';

const router = Router();

router.use(authMiddleware);

// Upload e preview do arquivo
router.post('/preview', checkPermission('contracts_create'), (req, res, next) => {
    uploadMiddleware(req, res, (err) => {
        if (err) {
            return res.status(400).json({ error: err.message });
        }
        next();
    });
}, ImportController.previewContractItems);

// Executar importação
router.post('/contract-items', checkPermission('contracts_create'), ImportController.importContractItems);

// Download de template
router.get('/template/:type', ImportController.downloadTemplate);

export default router;
