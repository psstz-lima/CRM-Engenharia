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
import commentRoutes from './routes/comment.routes';
import approvalRoutes from './routes/approval.routes';
import dashboardRoutes from './routes/dashboard.routes';
import reportRoutes from './routes/report.routes';
import importRoutes from './routes/import.routes';
import attachmentRoutes from './routes/attachment.routes';
import favoriteRoutes from './routes/favorite.routes';
import { setupSwagger } from './config/swagger';

const app = express();

// Setup Swagger API Docs
setupSwagger(app);

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
app.use('/api/comments', commentRoutes);
app.use('/api/approvals', approvalRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/import', importRoutes);
app.use('/api/attachments', attachmentRoutes);
app.use('/api/favorites', favoriteRoutes);

import { initScheduledJobs } from './modules/scheduled-jobs';

// Iniciar jobs agendados
initScheduledJobs();

app.listen(config.port, () => {
    console.log(`Server running on port ${config.port}`);
});
