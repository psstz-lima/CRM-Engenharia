import { Router } from 'express';
import { dwgController } from '../controllers/dwg.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

// Todas as rotas requerem autenticação
router.use(authMiddleware);

// SVG e Layers
router.get('/documents/:id/svg', dwgController.getSvg.bind(dwgController));
router.get('/documents/:id/layers', dwgController.getLayers.bind(dwgController));

// Anotações
router.get('/documents/:id/annotations', dwgController.getAnnotations.bind(dwgController));
router.post('/documents/:id/annotations', dwgController.createAnnotation.bind(dwgController));
router.put('/documents/:id/annotations/:annotationId', dwgController.updateAnnotation.bind(dwgController));
router.delete('/documents/:id/annotations/:annotationId', dwgController.deleteAnnotation.bind(dwgController));

// Manutenção
router.post('/dwg/cleanup-cache', dwgController.cleanupCache.bind(dwgController));

export default router;
