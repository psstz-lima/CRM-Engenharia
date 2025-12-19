import prisma from '../../../config/database';
import logger from '../../../config/logger';
import { AuditStatus } from '@prisma/client';

export interface AuditLogData {
    userId?: string;
    action: string;
    module: string;
    entityId?: string;
    entityType?: string;
    ipAddress?: string;
    userAgent?: string;
    deviceFingerprint?: string;
    status: AuditStatus;
    metadata?: any;
}

export class AuditService {
    static async log(data: AuditLogData): Promise<void> {
        try {
            await prisma.auditLog.create({
                data: {
                    userId: data.userId,
                    action: data.action,
                    module: data.module,
                    entityId: data.entityId,
                    entityType: data.entityType,
                    ipAddress: data.ipAddress,
                    userAgent: data.userAgent,
                    deviceFingerprint: data.deviceFingerprint,
                    status: data.status,
                    metadata: data.metadata,
                },
            });
        } catch (error) {
            logger.error('Erro ao registrar log de auditoria:', error);
        }
    }

    static async logLogin(
        userId: string,
        success: boolean,
        ipAddress?: string,
        userAgent?: string
    ): Promise<void> {
        await this.log({
            userId,
            action: 'login',
            module: 'auth',
            status: success ? AuditStatus.SUCCESS : AuditStatus.FAILURE,
            ipAddress,
            userAgent,
        });
    }

    static async logLogout(userId: string, ipAddress?: string): Promise<void> {
        await this.log({
            userId,
            action: 'logout',
            module: 'auth',
            status: AuditStatus.SUCCESS,
            ipAddress,
        });
    }

    static async logPasswordChange(
        userId: string,
        ipAddress?: string
    ): Promise<void> {
        await this.log({
            userId,
            action: 'password_change',
            module: 'auth',
            status: AuditStatus.SUCCESS,
            ipAddress,
        });
    }
}
