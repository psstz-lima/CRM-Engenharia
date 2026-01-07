import { Router } from 'express';
import { AttachmentController, attachmentUpload } from '../controllers/attachment.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

router.use(authMiddleware);

// List attachments for a target
router.get('/:targetType/:targetId', AttachmentController.list);

// Upload attachments
router.post('/upload', (req, res, next) => {
    attachmentUpload(req, res, (err) => {
        if (err) {
            return res.status(400).json({ error: err.message });
        }
        next();
    });
}, AttachmentController.upload);

// Download attachment
router.get('/download/:id', AttachmentController.download);

// Delete attachment
router.delete('/:id', AttachmentController.delete);

// Get counts for multiple targets
router.post('/counts', AttachmentController.getCounts);

export default router;
