import { Router } from 'express';
import { AuditLogController } from '../controllers/audit.controller';
import { authMiddleware, masterMiddleware } from '../middlewares/auth.middleware';

const router = Router();

router.get('/', authMiddleware, masterMiddleware, AuditLogController.list);

export default router;
