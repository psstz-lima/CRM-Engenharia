import { Request, Response } from 'express';
import prisma from '../config/database';
import { NotificationService } from '../services/notification.service';
import { ContractEventService } from '../services/contract-event.service';

export class TaskController {
    static async list(req: Request, res: Response) {
        try {
            const { assignedToId, contractId, status, priority } = req.query;
            const where: any = {};
            if (assignedToId) where.assignedToId = String(assignedToId);
            if (contractId) where.contractId = String(contractId);
            if (status) where.status = String(status);
            if (priority) where.priority = String(priority);

            const tasks = await prisma.task.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                include: {
                    assignedTo: { select: { id: true, fullName: true, email: true } },
                    createdBy: { select: { id: true, fullName: true } },
                    contract: { select: { id: true, number: true } }
                }
            });
            return res.json(tasks);
        } catch (e: any) {
            return res.status(500).json({ error: e.message });
        }
    }

    static async create(req: any, res: Response) {
        try {
            const { title, description, priority, assignedToId, contractId, dueDate, metadata } = req.body;
            if (!title) {
                return res.status(400).json({ error: 'title é obrigatório' });
            }

            const task = await prisma.task.create({
                data: {
                    title,
                    description,
                    priority,
                    assignedToId,
                    createdById: req.user?.id,
                    contractId,
                    dueDate: dueDate ? new Date(dueDate) : null,
                    metadata
                }
            });

            if (assignedToId) {
                await NotificationService.create(
                    assignedToId,
                    'TASK_ASSIGNED',
                    'Nova tarefa atribuída',
                    `Você recebeu a tarefa: ${title}`,
                    { taskId: task.id }
                );
            }

            if (contractId) {
                await ContractEventService.log(
                    contractId,
                    'TASK_CREATED',
                    `Tarefa criada: ${title}`,
                    { taskId: task.id },
                    req.user?.id
                );
            }

            return res.status(201).json(task);
        } catch (e: any) {
            return res.status(500).json({ error: e.message });
        }
    }

    static async update(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const data: any = { ...req.body };
            if (data.dueDate) data.dueDate = new Date(data.dueDate);

            const updated = await prisma.task.update({ where: { id }, data });
            return res.json(updated);
        } catch (e: any) {
            return res.status(500).json({ error: e.message });
        }
    }

    static async complete(req: any, res: Response) {
        try {
            const { id } = req.params;
            const task = await prisma.task.update({
                where: { id },
                data: { status: 'DONE', completedAt: new Date() }
            });

            if (task.contractId) {
                await ContractEventService.log(
                    task.contractId,
                    'TASK_COMPLETED',
                    `Tarefa concluída: ${task.title}`,
                    { taskId: task.id },
                    req.user?.id
                );
            }

            return res.json(task);
        } catch (e: any) {
            return res.status(500).json({ error: e.message });
        }
    }

    static async delete(req: Request, res: Response) {
        try {
            const { id } = req.params;
            await prisma.task.delete({ where: { id } });
            return res.status(204).send();
        } catch (e: any) {
            return res.status(500).json({ error: e.message });
        }
    }
}
