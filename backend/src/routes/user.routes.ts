import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { checkPermission } from '../middlewares/permissions.middleware';
import { auditMiddleware } from '../middlewares/audit.middleware';

const router = Router();

router.use(authMiddleware);

// View users - requires users_view permission
router.get('/', checkPermission('users_view'), UserController.list);

// Manage users - requires users_manage permission
router.post('/invite', checkPermission('users_manage'), auditMiddleware('INVITE', 'USERS'), UserController.invite);
router.post('/', checkPermission('users_manage'), auditMiddleware('CREATE', 'USERS'), UserController.create);
router.patch('/:id', checkPermission('users_manage'), auditMiddleware('UPDATE', 'USERS'), UserController.update);
router.patch('/:id/reset-password', checkPermission('users_manage'), auditMiddleware('RESET_PASSWORD', 'USERS'), UserController.resetUserPassword);
router.delete('/:id', checkPermission('users_manage'), auditMiddleware('DELETE', 'USERS'), UserController.delete);

export default router;
