import { Router } from 'express';
import { RoleController } from '../controllers/role.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { checkPermission } from '../middlewares/permissions.middleware';
import { auditMiddleware } from '../middlewares/audit.middleware';

const router = Router();

router.use(authMiddleware);

// Manage roles - requires admin_roles permission
router.get('/', checkPermission('admin_roles'), RoleController.list);
router.post('/', checkPermission('admin_roles'), auditMiddleware('CREATE', 'ROLES'), RoleController.create);
router.patch('/:id', checkPermission('admin_roles'), auditMiddleware('UPDATE', 'ROLES'), RoleController.update);
router.delete('/:id', checkPermission('admin_roles'), auditMiddleware('DELETE', 'ROLES'), RoleController.delete);

export default router;
