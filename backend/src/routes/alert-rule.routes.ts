import { Router } from 'express';
import { AlertRuleController } from '../controllers/alert-rule.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { checkPermission } from '../middlewares/permissions.middleware';

const router = Router();

router.use(authMiddleware);

router.get('/', checkPermission('admin_settings'), AlertRuleController.list);
router.post('/', checkPermission('admin_settings'), AlertRuleController.create);
router.patch('/:id', checkPermission('admin_settings'), AlertRuleController.update);
router.delete('/:id', checkPermission('admin_settings'), AlertRuleController.delete);

export default router;
