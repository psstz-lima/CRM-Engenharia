import { Router } from 'express';
import { CriticalAnalysisController } from '../controllers/critical-analysis.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

router.use(authMiddleware);

// Dashboard
router.get('/dashboard', CriticalAnalysisController.dashboard);

// Listar pendentes
router.get('/pending', CriticalAnalysisController.listPending);

// Histórico por documento
router.get('/document/:documentId', CriticalAnalysisController.history);

// CRUD
router.post('/', CriticalAnalysisController.create);
router.post('/:id/start', CriticalAnalysisController.start);
router.post('/:id/complete', CriticalAnalysisController.complete);

export default router;
