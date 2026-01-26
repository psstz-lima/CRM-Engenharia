import { Router } from 'express';
import { ReportController } from '../controllers/report.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { checkPermission } from '../middlewares/permissions.middleware';

const router = Router();

router.use(authMiddleware);

// Exportar medição individual
router.get('/measurement/:id/excel', checkPermission('reports_export'), ReportController.measurementToExcel);

// Exportar resumo de contrato
router.get('/contract/:id/excel', checkPermission('reports_export'), ReportController.contractSummaryToExcel);
router.get('/contract/:id/financial', checkPermission('reports_export'), ReportController.contractFinancial);

// Relatório geral de medições (filtrado por período/status)
router.get('/measurements', checkPermission('reports_export'), ReportController.measurementsReport);

export default router;
