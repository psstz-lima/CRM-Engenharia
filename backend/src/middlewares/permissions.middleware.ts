import { Request, Response, NextFunction } from 'express';

/**
 * Helper to check if user has a specific permission
 * Supports formats: 'users_view' or 'users.view' -> checks perms.users.view
 */
const checkPermissionInternal = (userPermissions: any, requiredPermission: string): boolean => {
    // Check for 'all' permission (admin override)
    if (userPermissions.all === true) {
        return true;
    }

    // Check direct permission (old format: users_view)
    if (userPermissions[requiredPermission] === true) {
        return true;
    }

    // Check nested format (new format: users.view or users_view -> users.view)
    const parts = requiredPermission.includes('_')
        ? requiredPermission.split('_')
        : requiredPermission.split('.');

    if (parts.length === 2) {
        const [module, action] = parts;
        // Check if module.action is true OR if module is a boolean true
        if (userPermissions[module]?.[action] === true || userPermissions[module] === true) {
            return true;
        }
    }

    // Check if module exists as object with any truthy permission
    const moduleName = parts[0];
    if (typeof userPermissions[moduleName] === 'object' && userPermissions[moduleName] !== null) {
        // If action is 'view' or 'manage', check if that specific action exists
        const action = parts[1];
        if (action && userPermissions[moduleName][action] === true) {
            return true;
        }
    }

    return false;
};

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

        if (checkPermissionInternal(userPermissions, requiredPermission)) {
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

        const hasPermission = requiredPermissions.some(p =>
            checkPermissionInternal(userPermissions, p)
        );
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

        const missingPermissions = requiredPermissions.filter(p =>
            !checkPermissionInternal(userPermissions, p)
        );
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
    return checkPermissionInternal(perms, permission);
};


