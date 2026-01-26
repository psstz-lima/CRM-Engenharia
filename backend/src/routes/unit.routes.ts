import { Router } from 'express';
import { UnitController } from '../controllers/unit.controller';

const router = Router();
const controller = new UnitController();

router.get('/', controller.getAll);
router.post('/', controller.create);
router.delete('/:id', controller.delete);
router.put('/:id', controller.update);

export default router;

