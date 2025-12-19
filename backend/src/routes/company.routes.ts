import { Router } from 'express';
import { CompanyController } from '../controllers/company.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { checkPermission } from '../middlewares/permissions.middleware';
import { auditMiddleware } from '../middlewares/audit.middleware';

const router = Router();

router.use(authMiddleware);

// View companies - requires companies_view permission
router.get('/', checkPermission('companies_view'), CompanyController.list);

// Manage companies - requires companies_manage permission
router.post('/', checkPermission('companies_manage'), auditMiddleware('CREATE', 'COMPANIES'), CompanyController.create);
router.patch('/:id', checkPermission('companies_manage'), auditMiddleware('UPDATE', 'COMPANIES'), CompanyController.update);
router.delete('/:id', checkPermission('companies_manage'), auditMiddleware('DELETE', 'COMPANIES'), CompanyController.delete);

export default router;
