import { Request, Response, NextFunction } from 'express';

/**
 * Middleware factory to check if user has required permission
 * Usage: router.get('/contracts', checkPermission('contracts_view'), ContractController.list)
 */
export const checkPermission = (requiredPermission: string) => {
    return (req: any, res: Response, next: NextFunction) => {
        // Master users bypass all permission checks
        if (req.user?.isMaster) {
            return next();
        }

        const userPermissions = req.user?.role?.permissions || {};

        // Check for 'all' permission (admin override)
        if (userPermissions.all === true) {
            return next();
        }

        // Check specific permission
        if (userPermissions[requiredPermission] === true) {
            return next();
        }

        return res.status(403).json({
            error: 'Acesso negado',
            message: `Você não tem permissão para: ${requiredPermission}`,
            requiredPermission
        });
    };
};

/**
 * Middleware to check if user has ANY of the required permissions
 */
export const checkAnyPermission = (...requiredPermissions: string[]) => {
    return (req: any, res: Response, next: NextFunction) => {
        if (req.user?.isMaster) {
            return next();
        }

        const userPermissions = req.user?.role?.permissions || {};

        if (userPermissions.all === true) {
            return next();
        }

        const hasPermission = requiredPermissions.some(p => userPermissions[p] === true);
        if (hasPermission) {
            return next();
        }

        return res.status(403).json({
            error: 'Acesso negado',
            message: `Requer uma das permissões: ${requiredPermissions.join(', ')}`,
            requiredPermissions
        });
    };
};

/**
 * Middleware to check if user has ALL of the required permissions
 */
export const checkAllPermissions = (...requiredPermissions: string[]) => {
    return (req: any, res: Response, next: NextFunction) => {
        if (req.user?.isMaster) {
            return next();
        }

        const userPermissions = req.user?.role?.permissions || {};

        if (userPermissions.all === true) {
            return next();
        }

        const missingPermissions = requiredPermissions.filter(p => !userPermissions[p]);
        if (missingPermissions.length === 0) {
            return next();
        }

        return res.status(403).json({
            error: 'Acesso negado',
            message: `Permissões faltando: ${missingPermissions.join(', ')}`,
            missingPermissions
        });
    };
};

/**
 * Helper to check permission in code (not middleware)
 */
export const hasPermission = (user: any, permission: string): boolean => {
    if (user?.isMaster) return true;
    const perms = user?.role?.permissions || {};
    return perms.all === true || perms[permission] === true;
};
