import { Router } from 'express';
import { ApprovalFlowController } from '../controllers/approval-flow.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { checkPermission } from '../middlewares/permissions.middleware';

const router = Router();

router.use(authMiddleware);

router.get('/contracts/:contractId/approval-flow', checkPermission('admin_roles'), ApprovalFlowController.getByContract);
router.put('/contracts/:contractId/approval-flow', checkPermission('admin_roles'), ApprovalFlowController.upsert);

export default router;
