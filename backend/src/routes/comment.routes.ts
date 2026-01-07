import { Router } from 'express';
import { CommentController } from '../controllers/comment.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

// Todas as rotas requerem autenticação
router.use(authMiddleware);

// Criar comentário
router.post('/', CommentController.create);

// Listar comentários por item
router.get('/:targetType/:targetId', CommentController.list);

// Deletar comentário
router.delete('/:id', CommentController.delete);

export default router;
