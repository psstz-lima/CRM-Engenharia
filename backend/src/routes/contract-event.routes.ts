import { Router } from 'express';
import { ContractEventController } from '../controllers/contract-event.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { checkPermission } from '../middlewares/permissions.middleware';

const router = Router();

router.use(authMiddleware);

router.get('/contracts/:contractId/events', checkPermission('contracts_view'), ContractEventController.listByContract);

export default router;
