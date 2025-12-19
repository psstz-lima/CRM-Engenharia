import { Router } from 'express';
import { ProfileController } from '../controllers/profile.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { auditMiddleware } from '../middlewares/audit.middleware';
import { upload } from '../middlewares/upload.middleware';

const router = Router();

router.use(authMiddleware);

router.get('/', ProfileController.getProfile);
router.patch('/', auditMiddleware('UPDATE_PROFILE', 'PROFILE'), ProfileController.updateProfile);
router.patch('/password', auditMiddleware('CHANGE_PASSWORD', 'PROFILE'), ProfileController.changePassword);
router.post('/photo', upload.single('photo'), ProfileController.uploadPhoto);
router.post('/terms', auditMiddleware('ACCEPT_TERMS', 'PROFILE'), ProfileController.acceptTerms);
router.get('/security', ProfileController.getSecurity);
router.delete('/devices/:id', ProfileController.deleteDevice);
router.patch('/devices/:id/trust', ProfileController.trustDevice);
router.delete('/sessions/:id', ProfileController.deleteSession);

export default router;
