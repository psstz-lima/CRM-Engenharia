import multer from 'multer';
import crypto from 'crypto';
import path from 'path';

const storage = multer.diskStorage({
    destination: 'uploads/',
    filename: (req, file, cb) => {
        const uniqueName = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
    },
});

export const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });
