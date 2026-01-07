import { Router } from 'express';
import { FavoriteController } from '../controllers/favorite.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

router.use(authMiddleware);

// List user favorites
router.get('/', FavoriteController.list);

// Toggle favorite (add/remove)
router.post('/toggle', FavoriteController.toggle);

// Check if target is favorited
router.get('/check/:targetType/:targetId', FavoriteController.check);

// Remove favorite by ID
router.delete('/:id', FavoriteController.remove);

export default router;
