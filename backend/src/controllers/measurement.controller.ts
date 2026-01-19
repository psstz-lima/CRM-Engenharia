import { Request, Response } from 'express';
import prisma from '../config/database';

export class MeasurementController {

    // List measurements for a contract
    static async list(req: Request, res: Response) {
        try {
            const { contractId } = req.params;
            const measurements = await prisma.measurement.findMany({
                where: { contractId },
                orderBy: { number: 'desc' }
            });
            return res.json(measurements);
        } catch (e: any) {
            return res.status(500).json({ error: e.message });
        }
    }

    // Get specific measurement details with items
    static async getById(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const measurement = await prisma.measurement.findUnique({
                where: { id },
                include: { items: { include: { contractItem: true, memories: true } } }
            });
            if (!measurement) return res.status(404).json({ error: 'MediÃ§Ã£o nÃ£o encontrada' });
            return res.json(measurement);
        } catch (e: any) {
            return res.status(500).json({ error: e.message });
        }
    }

    // Create a new Measurement
    // Automatically finds the next number
    static async create(req: Request, res: Response) {
        try {
            const { contractId } = req.params;
            const { periodStart, periodEnd, notes } = req.body;
            if (!periodStart || !periodEnd) {
                return res.status(400).json({ error: 'periodStart e periodEnd são obrigatórios' });
            }
            const start = new Date(periodStart);
            const end = new Date(periodEnd);
            if (isNaN(start.getTime()) || isNaN(end.getTime())) {
                return res.status(400).json({ error: 'Datas inválidas' });
            }
            if (start > end) {
                return res.status(400).json({ error: 'periodStart não pode ser maior que periodEnd' });
            }

            // Find last number
            const last = await prisma.measurement.findFirst({
                where: { contractId },
                orderBy: { number: 'desc' }
            });
            const number = (last?.number || 0) + 1;

            const measurement = await prisma.measurement.create({
                data: {
                    contractId,
                    number,
                    periodStart: start,
                    periodEnd: end,
                    notes,
                    status: 'DRAFT'
                }
            });

            return res.json(measurement);
        } catch (e: any) {
            return res.status(500).json({ error: e.message });
        }
    }

    // Helper: Get vigent values for a contract item (applying approved addendums)
    private static async getVigentItemValues(contractItemId: string, contractId: string): Promise<{
        quantity: number;
        unitPrice: number;
        isSuppressed: boolean;
    }> {
        const item = await prisma.contractItem.findUnique({ where: { id: contractItemId } });
        if (!item) throw new Error('Item nÃ£o encontrado');

        let quantity = Number(item.quantity) || 0;
        let unitPrice = Number(item.unitPrice) || 0;
        let isSuppressed = false;

        // Get approved addendums with operations for this item
        const addendums = await prisma.contractAddendum.findMany({
            where: { contractId, status: 'APPROVED' },
            include: { operations: { where: { contractItemId } } },
            orderBy: { number: 'asc' }
        });

        // Apply operations in order
        for (const addendum of addendums) {
            for (const op of addendum.operations) {
                switch (op.operationType) {
                    case 'SUPPRESS':
                        isSuppressed = true;
                        quantity = 0;
                        break;
                    case 'MODIFY_QTY':
                        quantity = Number(op.newQuantity) || quantity;
                        break;
                    case 'MODIFY_PRICE':
                        unitPrice = Number(op.newPrice) || unitPrice;
                        break;
                    case 'MODIFY_BOTH':
                        quantity = Number(op.newQuantity) || quantity;
                        unitPrice = Number(op.newPrice) || unitPrice;
                        break;
                }
            }
        }

        return { quantity, unitPrice, isSuppressed };
    }

    // Measure an Item
    static async updateItem(req: Request, res: Response) {
        try {
            const { id } = req.params; // Measurement ID
            const { contractItemId, quantity } = req.body;
            const normalizedQuantity = Number(quantity);
            if (!Number.isFinite(normalizedQuantity) || normalizedQuantity < 0) {
                return res.status(400).json({ error: 'Quantidade inválida' });
            }

            const measurement = await prisma.measurement.findUnique({ where: { id } });
            if (!measurement) return res.status(404).json({ error: 'MediÃ§Ã£o nÃ£o encontrada' });
            if (measurement.status !== 'DRAFT') return res.status(400).json({ error: 'Apenas mediÃ§Ãµes em Rascunho podem ser alteradas' });

            const contractItem = await prisma.contractItem.findUnique({ where: { id: contractItemId } });
            if (!contractItem) return res.status(404).json({ error: 'Item nÃ£o encontrado' });

            // Get VIGENT values (with addendums applied)
            const vigent = await MeasurementController.getVigentItemValues(contractItemId, measurement.contractId);

            // Check if item is suppressed
            if (vigent.isSuppressed) {
                return res.status(400).json({ error: 'Item suprimido por aditivo. NÃ£o Ã© possÃ­vel medir.' });
            }

            // Calculate Accumulated from PREVIOUS CLOSED measurements
            const aggregations = await prisma.measurementItem.aggregate({
                where: {
                    contractItemId,
                    measurement: {
                        contractId: measurement.contractId,
                        status: 'CLOSED'
                    }
                },
                _sum: { measuredQuantity: true }
            });

            const alreadyMeasured = Number(aggregations._sum.measuredQuantity || 0);
            // Use VIGENT quantity for balance calculation
            const currentBalance = vigent.quantity - alreadyMeasured;

            if (normalizedQuantity > currentBalance) {
                return res.status(400).json({
                    error: `Saldo insuficiente. Saldo vigente: ${currentBalance.toFixed(3)}, Tentativa: ${normalizedQuantity}`
                });
            }

            // Check if item has memories. If so, prevent direct update.
            const existingItem = await prisma.measurementItem.findUnique({
                where: { measurementId_contractItemId: { measurementId: id, contractItemId } },
                include: { memories: true }
            });

            if (existingItem && existingItem.memories.length > 0) {
                return res.status(400).json({ error: 'Este item possui memÃ³ria de cÃ¡lculo. Use a calculadora para editar.' });
            }

            // Upsert Measurement Item with VIGENT price
            const item = await prisma.measurementItem.upsert({
                where: {
                    measurementId_contractItemId: {
                        measurementId: id,
                        contractItemId
                    }
                },
                update: {
                    measuredQuantity: normalizedQuantity,
                    currentPrice: vigent.unitPrice, // Use VIGENT price
                    accumulatedQuantity: alreadyMeasured
                },
                create: {
                    measurementId: id,
                    contractItemId,
                    measuredQuantity: normalizedQuantity,
                    currentPrice: vigent.unitPrice, // Use VIGENT price
                    accumulatedQuantity: alreadyMeasured
                }
            });

            return res.json(item);

        } catch (e: any) {
            return res.status(500).json({ error: e.message });
        }
    }

    // Close Measurement
    static async close(req: Request, res: Response) {
        try {
            const { id } = req.params;
            // Validations?
            await prisma.measurement.update({
                where: { id },
                data: { status: 'CLOSED' }
            });
            return res.json({ message: 'MediÃ§Ã£o fechada com sucesso' });
        } catch (e: any) {
            return res.status(500).json({ error: e.message });
        }
    }

    // Get Balances for all items up to this measurement (exclusive)
    // Returns vigent quantities and measured amounts for proper balance calculation
    static async getBalances(req: Request, res: Response) {
        try {
            const { id } = req.params; // Measurement ID
            const measurement = await prisma.measurement.findUnique({ where: { id } });
            if (!measurement) return res.status(404).json({ error: 'MediÃ§Ã£o nÃ£o encontrada' });

            // Get all contract items
            const contractItems = await prisma.contractItem.findMany({
                where: { contractId: measurement.contractId, type: 'ITEM' }
            });

            // Get measured quantities from previous CLOSED measurements
            const aggregations = await prisma.measurementItem.groupBy({
                by: ['contractItemId'],
                where: {
                    measurement: {
                        contractId: measurement.contractId,
                        status: 'CLOSED',
                        number: { lt: measurement.number }
                    }
                },
                _sum: { measuredQuantity: true }
            });

            const measuredMap: Record<string, number> = {};
            aggregations.forEach(a => {
                measuredMap[a.contractItemId] = Number(a._sum.measuredQuantity || 0);
            });

            // Build balances with vigent values
            const balances: Record<string, { measured: number; vigent: number; vigentPrice: number; balance: number; isSuppressed: boolean }> = {};

            for (const item of contractItems) {
                const vigent = await MeasurementController.getVigentItemValues(item.id, measurement.contractId);
                const measured = measuredMap[item.id] || 0;
                balances[item.id] = {
                    measured,
                    vigent: vigent.quantity,
                    vigentPrice: vigent.unitPrice,
                    balance: vigent.quantity - measured,
                    isSuppressed: vigent.isSuppressed
                };
            }

            return res.json(balances);
        } catch (e: any) {
            return res.status(500).json({ error: e.message });
        }
    }

    // --- MEMORIES (CALCULATION MEMORY) ---

    // Add Memory Row
    static async addMemory(req: Request, res: Response) {
        try {
            const { id } = req.params; // Measurement ID
            const { contractItemId, description, startPoint, endPoint, length, width, height, quantity, metadata } = req.body;

            const measurement = await prisma.measurement.findUnique({ where: { id } });
            if (!measurement || measurement.status !== 'DRAFT') return res.status(400).json({ error: 'MediÃ§Ã£o invÃ¡lida ou fechada' });

            // Ensure MeasurementItem exists
            let item = await prisma.measurementItem.findUnique({
                where: { measurementId_contractItemId: { measurementId: id, contractItemId } }
            });

            if (!item) {
                // Fetch contract item
                const ci = await prisma.contractItem.findUnique({ where: { id: contractItemId } });
                if (!ci) return res.status(404).json({ error: 'Item de contrato nÃ£o encontrado' });

                // Get vigent values (with addendums applied)
                const vigent = await MeasurementController.getVigentItemValues(contractItemId, measurement.contractId);

                if (vigent.isSuppressed) {
                    return res.status(400).json({ error: 'Item suprimido por aditivo. NÃ£o Ã© possÃ­vel medir.' });
                }

                // Create initial item with 0 quantity and VIGENT price
                item = await prisma.measurementItem.create({
                    data: {
                        measurementId: id,
                        contractItemId,
                        measuredQuantity: 0,
                        accumulatedQuantity: 0,
                        currentPrice: vigent.unitPrice // Use VIGENT price
                    }
                });
            }

            // Create Memory
            await prisma.measurementMemory.create({
                data: {
                    measurementItemId: item.id,
                    description,
                    startPoint,
                    endPoint,
                    length,
                    width,
                    height,
                    quantity,
                    metadata // Added metadata
                } as any
            });

            // Recalculate Total
            await MeasurementController.recalculateItemQuantity(item.id);

            return res.json({ message: 'MemÃ³ria adicionada' });

        } catch (e: any) {
            return res.status(500).json({ error: e.message });
        }
    }

    // Remove Memory Row
    static async removeMemory(req: Request, res: Response) {
        try {
            const { memoryId } = req.params;
            const memory = await prisma.measurementMemory.findUnique({ include: { measurementItem: { include: { measurement: true } } }, where: { id: memoryId } });

            if (!memory) return res.status(404).json({ error: 'MemÃ³ria nÃ£o encontrada' });
            if (memory.measurementItem.measurement.status !== 'DRAFT') return res.status(400).json({ error: 'MediÃ§Ã£o fechada' });

            await prisma.measurementMemory.delete({ where: { id: memoryId } });

            // Recalculate
            await MeasurementController.recalculateItemQuantity(memory.measurementItemId);

            return res.json({ message: 'MemÃ³ria removida' });

        } catch (e: any) {
            return res.status(500).json({ error: e.message });
        }
    }

    // List Memories for an Item within a Measurement
    static async listMemories(req: Request, res: Response) {
        try {
            const { id, itemId } = req.params; // id=measurementId, itemId=contractItemId (or measurementItemId?)
            // Let's use measurementId + contractItemId to find unique MeasurementItem

            const item = await prisma.measurementItem.findUnique({
                where: { measurementId_contractItemId: { measurementId: id, contractItemId: itemId } },
                include: { memories: { orderBy: { createdAt: 'asc' } } }
            });

            return res.json(item?.memories || []);
        } catch (e: any) {
            return res.status(500).json({ error: e.message });
        }
    }

    // Get specific measurement item details (including config/metadata)
    static async getItem(req: Request, res: Response) {
        try {
            const { id, itemId } = req.params; // id=measurementId, itemId=contractItemId

            let item = await prisma.measurementItem.findUnique({
                where: { measurementId_contractItemId: { measurementId: id, contractItemId: itemId } },
                include: {
                    memories: true,
                    contractItem: true
                }
            });

            if (!item) {
                const contractItem = await prisma.contractItem.findUnique({ where: { id: itemId } });
                if (contractItem) {
                    return res.json({ contractItem });
                }
            }

            return res.json(item);
        } catch (e: any) {
            return res.status(500).json({ error: e.message });
        }
    }

    // Update Measurement Item Configuration (Metadata)
    static async updateItemConfig(req: Request, res: Response) {
        try {
            const { id, itemId } = req.params; // id=measurementId, itemId=contractItemId
            const { metadata } = req.body;

            // Ensure item exists. If not, create it with 0 values just to store metadata?
            // Yes, user might configure columns before adding any memory.

            let item = await prisma.measurementItem.findUnique({
                where: { measurementId_contractItemId: { measurementId: id, contractItemId: itemId } }
            });

            if (!item) {
                // Fetch contract item and measurement
                const ci = await prisma.contractItem.findUnique({ where: { id: itemId } });
                if (!ci) return res.status(404).json({ error: 'Item de contrato nÃ£o encontrado' });

                const measurement = await prisma.measurement.findUnique({ where: { id } });
                if (!measurement) return res.status(404).json({ error: 'MediÃ§Ã£o nÃ£o encontrada' });

                // Get vigent values (with addendums applied)
                const vigent = await MeasurementController.getVigentItemValues(itemId, measurement.contractId);

                item = await prisma.measurementItem.create({
                    data: {
                        measurementId: id,
                        contractItemId: itemId,
                        measuredQuantity: 0,
                        accumulatedQuantity: 0,
                        currentPrice: vigent.unitPrice, // Use VIGENT price
                        metadata
                    } as any
                });
            } else {
                item = await prisma.measurementItem.update({
                    where: { id: item.id },
                    data: { metadata } as any
                });
            }

            return res.json(item);

        } catch (e: any) {
            return res.status(500).json({ error: e.message });
        }
    }

    // Helper: Recalculate Item Quantity based on Memories
    private static async recalculateItemQuantity(measurementItemId: string) {
        const aggregations = await prisma.measurementMemory.aggregate({
            where: { measurementItemId },
            _sum: { quantity: true }
        });

        const total = aggregations._sum.quantity || 0;

        await prisma.measurementItem.update({
            where: { id: measurementItemId },
            data: { measuredQuantity: total }
        });
    }

    // Reopen a closed measurement (creates a revision)
    static async reopen(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const userId = (req as any).userId;
            const { reason } = req.body;

            if (!reason) {
                return res.status(400).json({ error: 'Motivo da revisÃ£o Ã© obrigatÃ³rio' });
            }

            // Get user info
            const user = await prisma.user.findUnique({ where: { id: userId } });
            if (!user) return res.status(404).json({ error: 'UsuÃ¡rio nÃ£o encontrado' });

            // Get measurement with all data
            const measurement = await prisma.measurement.findUnique({
                where: { id },
                include: {
                    items: { include: { memories: true } },
                    approvals: true
                }
            });

            if (!measurement) return res.status(404).json({ error: 'MediÃ§Ã£o nÃ£o encontrada' });
            if (measurement.status === 'DRAFT') {
                return res.status(400).json({ error: 'MediÃ§Ã£o jÃ¡ estÃ¡ aberta' });
            }

            // Count existing revisions
            const revisionCount = await prisma.measurementRevision.count({
                where: { measurementId: id }
            });

            // Create revision with snapshot
            await prisma.measurementRevision.create({
                data: {
                    measurementId: id,
                    revisionNumber: revisionCount + 1,
                    reason,
                    snapshotData: {
                        status: measurement.status,
                        items: measurement.items,
                        approvals: measurement.approvals,
                        closedAt: new Date().toISOString()
                    },
                    createdById: userId,
                    createdByName: user.fullName
                }
            });

            // Delete existing approvals (need to re-approve after revision)
            await prisma.measurementApproval.deleteMany({
                where: { measurementId: id }
            });

            // Reopen measurement
            await prisma.measurement.update({
                where: { id },
                data: { status: 'DRAFT' }
            });

            return res.json({ message: 'MediÃ§Ã£o reaberta para revisÃ£o', revisionNumber: revisionCount + 1 });
        } catch (e: any) {
            return res.status(500).json({ error: e.message });
        }
    }

    // List revisions of a measurement
    static async listRevisions(req: Request, res: Response) {
        try {
            const { id } = req.params;

            const revisions = await prisma.measurementRevision.findMany({
                where: { measurementId: id },
                orderBy: { revisionNumber: 'desc' }
            });

            return res.json(revisions);
        } catch (e: any) {
            return res.status(500).json({ error: e.message });
        }
    }
}


