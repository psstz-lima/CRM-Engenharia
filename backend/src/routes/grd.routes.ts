import { Router } from 'express';
import { GRDController } from '../controllers/grd.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

router.use(authMiddleware);

// Dashboard
router.get('/dashboard', GRDController.dashboard);

// Listar por contrato
router.get('/contract/:contractId', GRDController.list);

// Listar todas
router.get('/', GRDController.list);

// CRUD
router.get('/:id', GRDController.getById);
router.post('/', GRDController.create);
router.put('/:id', GRDController.update);
router.delete('/:id', GRDController.cancel);

// Workflow
router.post('/:id/send', GRDController.send);
router.post('/:id/confirm', GRDController.confirm);

// Itens
router.post('/:id/items', GRDController.addItem);
router.delete('/:id/items/:itemId', GRDController.removeItem);

export default router;
