import { Router } from 'express';
import { TaskController } from '../controllers/task.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { checkPermission } from '../middlewares/permissions.middleware';

const router = Router();

router.use(authMiddleware);

router.get('/', checkPermission('tasks_view'), TaskController.list);
router.post('/', checkPermission('tasks_manage'), TaskController.create);
router.patch('/:id', checkPermission('tasks_manage'), TaskController.update);
router.post('/:id/complete', checkPermission('tasks_manage'), TaskController.complete);
router.delete('/:id', checkPermission('tasks_manage'), TaskController.delete);

export default router;
