import prisma from '../../config/database';
import { NotificationType } from '@prisma/client';

export class NotificationService {
    static async create(userId: string, type: NotificationType, title: string, message: string, metadata?: any) {
        try {
            return await prisma.notification.create({
                data: {
                    userId,
                    type,
                    title,
                    message,
                    metadata,
                    isRead: false
                }
            });
        } catch (error) {
            console.error('Error creating notification:', error);
            // Don't throw, just log. Notifications shouldn't break main flow.
        }
    }

    static async notifyAdmins(type: NotificationType, title: string, message: string, metadata?: any) {
        // Find all admins (assuming role based or isMaster)
        // For simplicity, notifying all MASTER users or specific roles
        const admins = await prisma.user.findMany({
            where: { isMaster: true }
        });

        for (const admin of admins) {
            await this.create(admin.id, type, title, message, metadata);
        }
    }
}
