import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { config } from './config';
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import profileRoutes from './routes/profile.routes';
import companyRoutes from './routes/company.routes';
import roleRoutes from './routes/role.routes';
import notificationRoutes from './routes/notification.routes';
import auditRoutes from './routes/audit.routes';
import contractRoutes from './routes/contract.routes';
import unitRoutes from './routes/unit.routes';

const app = express();

// RATE LIMITERS
const globalLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minuto
    max: 1000, // Increased for dev
    message: 'Muitas requisições. Tente novamente em 1 minuto.',
    standardHeaders: true,
    legacyHeaders: false,
});

// MIDDLEWARES
app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    crossOriginEmbedderPolicy: false
}));
app.use(cors({ origin: config.frontendUrl, credentials: true }));
app.use(express.json());
app.use(cookieParser());
// Serve uploads from backend/uploads with cross-origin headers
app.use('/uploads', (req, res, next) => {
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    next();
}, express.static(path.resolve(__dirname, '../uploads')));

// Aplicar rate limiter global
app.use('/api', globalLimiter);

// ROUTES
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/audit-logs', auditRoutes);
app.use('/api/contracts', contractRoutes);
app.use('/api/units', unitRoutes);

app.listen(config.port, () => {
    console.log(`Server running on port ${config.port}`);
});
