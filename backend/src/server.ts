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
import documentRoutes from './routes/document.routes';
import criticalAnalysisRoutes from './routes/critical-analysis.routes';
import grdRoutes from './routes/grd.routes';
import dwgRoutes from './routes/dwg.routes';
import taskRoutes from './routes/task.routes';
import alertRuleRoutes from './routes/alert-rule.routes';
import approvalFlowRoutes from './routes/approval-flow.routes';
import contractEventRoutes from './routes/contract-event.routes';
import { setupSwagger } from './config/swagger';

const app = express();

// Setup Swagger API Docs
setupSwagger(app);
const frontendOrigins = [
    config.frontendUrl,
    ...(process.env.FRONTEND_URLS?.split(',').map(origin => origin.trim()).filter(Boolean) ?? [])
].filter(Boolean);

const isAllowedOrigin = (origin: string) => {
    if (frontendOrigins.includes(origin)) return true;
    if (/^http:\/\/(localhost|127\.0\.0\.1):3000$/.test(origin)) return true;
    if (/^http:\/\/172\.16\.\d+\.\d+:3000$/.test(origin)) return true;
    return false;
};

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
app.use(cors({
    origin: (origin, callback) => {
        if (!origin || isAllowedOrigin(origin)) {
            return callback(null, true);
        }
        return callback(new Error('CORS bloqueado'));
    },
    credentials: true
}));
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
app.use('/api/documents', documentRoutes);
app.use('/api/critical-analysis', criticalAnalysisRoutes);
app.use('/api/grd', grdRoutes);
app.use('/api', dwgRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/alert-rules', alertRuleRoutes);
app.use('/api', approvalFlowRoutes);
app.use('/api', contractEventRoutes);

import { initScheduledJobs } from './modules/scheduled-jobs';

// Iniciar jobs agendados
// Iniciar jobs agendados
initScheduledJobs();

// Error Handler Global
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('SERVER ERROR:', err);
    res.status(500).json({ error: err.message || 'Erro interno do servidor' });
});

app.listen(config.port, () => {
    console.log(`Server running on port ${config.port}`);
});
// Force restart timestamp: 2026-01-08T15:38:00




