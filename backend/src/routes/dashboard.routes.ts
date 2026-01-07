import { Router } from 'express';
import { DashboardController } from '../controllers/dashboard.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

router.use(authMiddleware);

router.get('/stats', DashboardController.getStats);
router.get('/timeline', DashboardController.getTimeline);
router.get('/top-contracts', DashboardController.getTopContracts);
router.get('/expiring-contracts', DashboardController.getExpiringContracts);
router.get('/pending-approvals', DashboardController.getPendingApprovals);

export default router;
