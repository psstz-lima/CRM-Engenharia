import { Router } from 'express';
import { ApprovalController } from '../controllers/approval.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

// Todas as rotas requerem autenticação
router.use(authMiddleware);

// Níveis de aprovação
router.get('/levels', ApprovalController.listLevels);
router.post('/levels', ApprovalController.createLevel);
router.put('/levels/:id', ApprovalController.updateLevel);
router.delete('/levels/:id', ApprovalController.deleteLevel);

// Aprovações de medições
router.post('/measurements', ApprovalController.approveMeasurement);
router.get('/measurements/:measurementId', ApprovalController.listApprovals);

export default router;
