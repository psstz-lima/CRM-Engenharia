import { Request, Response } from 'express';
import prisma from '../config/database';
import { AddendumOperationType } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

export class AddendumController {
    // List all addendums for a contract
    static async list(req: Request, res: Response) {
        try {
            const { contractId } = req.params;

            const addendums = await prisma.contractAddendum.findMany({
                where: { contractId },
                include: {
                    operations: {
                        include: { contractItem: true }
                    }
                },
                orderBy: { number: 'asc' }
            });

            res.json(addendums);
        } catch (e: any) {
            res.status(500).json({ error: e.message });
        }
    }

    // Get single addendum with details
    static async getById(req: Request, res: Response) {
        try {
            const { id } = req.params;

            const addendum = await prisma.contractAddendum.findUnique({
                where: { id },
                include: {
                    operations: {
                        include: { contractItem: true }
                    },
                    contract: true
                }
            });

            if (!addendum) {
                return res.status(404).json({ error: 'Aditivo não encontrado' });
            }

            res.json(addendum);
        } catch (e: any) {
            res.status(500).json({ error: e.message });
        }
    }

    // Create new addendum
    static async create(req: Request, res: Response) {
        try {
            const { contractId } = req.params;
            const { description, date } = req.body;

            // Get next number based on APPROVED addendums only (drafts/cancelled don't count)
            const approvedCount = await prisma.contractAddendum.count({
                where: { contractId, status: 'APPROVED' }
            });
            const nextNumber = approvedCount + 1;

            const addendum = await prisma.contractAddendum.create({
                data: {
                    contractId,
                    number: nextNumber,
                    description,
                    date: new Date(date),
                    status: 'DRAFT'
                }
            });

            res.status(201).json(addendum);
        } catch (e: any) {
            res.status(500).json({ error: e.message });
        }
    }

    // Add operation to addendum
    static async addOperation(req: Request, res: Response) {
        try {
            const { addendumId } = req.params;
            const {
                operationType,
                contractItemId,
                newItemType,
                newItemCode,
                newItemDescription,
                newItemParentId,
                newItemUnit,
                newQuantity,
                newPrice
            } = req.body;

            // Verify addendum exists and is DRAFT
            const addendum = await prisma.contractAddendum.findUnique({
                where: { id: addendumId }
            });

            if (!addendum) {
                return res.status(404).json({ error: 'Aditivo não encontrado' });
            }
            if (addendum.status !== 'DRAFT') {
                return res.status(400).json({ error: 'Aditivo não está em rascunho' });
            }

            // Get original values if modifying existing item
            let originalQuantity: Decimal | null = null;
            let originalPrice: Decimal | null = null;

            if (contractItemId && operationType !== 'ADD') {
                const item = await prisma.contractItem.findUnique({
                    where: { id: contractItemId }
                });
                if (item) {
                    originalQuantity = item.quantity;
                    originalPrice = item.unitPrice;
                }
            }

            // Calculate operation value
            let operationValue = 0;
            const origQty = Number(originalQuantity) || 0;
            const origPrice = Number(originalPrice) || 0;
            const newQty = Number(newQuantity) || origQty;
            const newPrc = Number(newPrice) || origPrice;

            if (operationType === 'SUPPRESS') {
                // Suppression = negative of original total
                operationValue = -(origQty * origPrice);
            } else if (operationType === 'ADD') {
                // Addition = new total
                operationValue = newQty * newPrc;
            } else {
                // Modification = difference
                const originalTotal = origQty * origPrice;
                const newTotal = newQty * newPrc;
                operationValue = newTotal - originalTotal;
            }

            const operation = await prisma.addendumOperation.create({
                data: {
                    addendumId,
                    operationType: operationType as AddendumOperationType,
                    contractItemId,
                    newItemType,
                    newItemCode,
                    newItemDescription,
                    newItemParentId,
                    newItemUnit,
                    originalQuantity,
                    originalPrice,
                    newQuantity: newQuantity ? new Decimal(newQuantity) : null,
                    newPrice: newPrice ? new Decimal(newPrice) : null,
                    operationValue: new Decimal(operationValue)
                },
                include: { contractItem: true }
            });

            // Update addendum totals
            await AddendumController.recalculateTotals(addendumId);

            res.status(201).json(operation);
        } catch (e: any) {
            console.error(e);
            res.status(500).json({ error: e.message });
        }
    }

    // Remove operation from addendum
    static async removeOperation(req: Request, res: Response) {
        try {
            const { operationId } = req.params;

            const operation = await prisma.addendumOperation.findUnique({
                where: { id: operationId },
                include: { addendum: true }
            });

            if (!operation) {
                return res.status(404).json({ error: 'Operação não encontrada' });
            }
            if (operation.addendum.status !== 'DRAFT') {
                return res.status(400).json({ error: 'Aditivo não está em rascunho' });
            }

            await prisma.addendumOperation.delete({ where: { id: operationId } });

            // Recalculate totals
            await AddendumController.recalculateTotals(operation.addendumId);

            res.status(204).send();
        } catch (e: any) {
            res.status(500).json({ error: e.message });
        }
    }

    // Approve addendum
    static async approve(req: Request, res: Response) {
        try {
            const { id } = req.params;

            const addendum = await prisma.contractAddendum.findUnique({
                where: { id },
                include: { operations: true }
            });

            if (!addendum) {
                return res.status(404).json({ error: 'Aditivo não encontrado' });
            }
            if (addendum.status !== 'DRAFT') {
                return res.status(400).json({ error: 'Aditivo não está em rascunho' });
            }
            if (addendum.operations.length === 0) {
                return res.status(400).json({ error: 'Aditivo não possui operações' });
            }

            // Update status
            const updated = await prisma.contractAddendum.update({
                where: { id },
                data: { status: 'APPROVED' }
            });

            res.json(updated);
        } catch (e: any) {
            res.status(500).json({ error: e.message });
        }
    }

    // Cancel addendum (with warning)
    static async cancel(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { confirmCancellation } = req.body;

            const addendum = await prisma.contractAddendum.findUnique({
                where: { id }
            });

            if (!addendum) {
                return res.status(404).json({ error: 'Aditivo não encontrado' });
            }

            // If approved, require explicit confirmation
            if (addendum.status === 'APPROVED' && !confirmCancellation) {
                return res.status(400).json({
                    error: 'Confirmação necessária para cancelar aditivo aprovado',
                    requiresConfirmation: true,
                    warning: 'Cancelar um aditivo aprovado pode causar inconsistências. Recomenda-se criar um novo aditivo para reverter as alterações.'
                });
            }

            const updated = await prisma.contractAddendum.update({
                where: { id },
                data: { status: 'CANCELLED' }
            });

            res.json(updated);
        } catch (e: any) {
            res.status(500).json({ error: e.message });
        }
    }

    // Get contract items with vigent values (applying approved addendums)
    static async getVigentItems(req: Request, res: Response) {
        try {
            const { contractId } = req.params;

            // Get all contract items
            const items = await prisma.contractItem.findMany({
                where: { contractId },
                orderBy: { orderIndex: 'asc' }
            });

            // Get all approved addendums with operations
            const addendums = await prisma.contractAddendum.findMany({
                where: { contractId, status: 'APPROVED' },
                include: { operations: true },
                orderBy: { number: 'asc' }
            });

            // Apply addendums to get vigent values
            const vigentItems = items.map(item => {
                let quantity = Number(item.quantity) || 0;
                let unitPrice = Number(item.unitPrice) || 0;
                let isSuppressed = false;

                // Track history by addendum
                const history: any[] = [{
                    source: 'BASE',
                    quantity,
                    unitPrice,
                    totalValue: quantity * unitPrice
                }];

                // Apply operations from each addendum
                for (const addendum of addendums) {
                    const ops = addendum.operations.filter(o => o.contractItemId === item.id);

                    for (const op of ops) {
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

                    if (ops.length > 0) {
                        history.push({
                            source: `ADITIVO ${addendum.number}`,
                            addendumId: addendum.id,
                            quantity,
                            unitPrice,
                            totalValue: quantity * unitPrice
                        });
                    }
                }

                // Calculate variations
                const baseQty = Number(item.quantity) || 0;
                const basePrice = Number(item.unitPrice) || 0;
                const baseTotal = baseQty * basePrice;
                const vigentTotal = quantity * unitPrice;

                return {
                    ...item,
                    vigentQuantity: quantity,
                    vigentUnitPrice: unitPrice,
                    vigentTotalValue: vigentTotal,
                    isSuppressed,
                    variation: {
                        quantity: quantity - baseQty,
                        quantityPercent: baseQty ? ((quantity - baseQty) / baseQty * 100) : 0,
                        value: vigentTotal - baseTotal,
                        valuePercent: baseTotal ? ((vigentTotal - baseTotal) / baseTotal * 100) : 0
                    },
                    history
                };
            });

            // Include items added by addendums
            const addedItems: any[] = [];
            for (const addendum of addendums) {
                const addOps = addendum.operations.filter(o => o.operationType === 'ADD');
                for (const op of addOps) {
                    addedItems.push({
                        id: `added_${op.id}`,
                        contractId,
                        type: op.newItemType,
                        code: op.newItemCode,
                        description: op.newItemDescription,
                        unit: op.newItemUnit,
                        parentId: op.newItemParentId,
                        quantity: 0,
                        unitPrice: 0,
                        totalValue: 0,
                        vigentQuantity: Number(op.newQuantity) || 0,
                        vigentUnitPrice: Number(op.newPrice) || 0,
                        vigentTotalValue: Number(op.operationValue) || 0,
                        isSuppressed: false,
                        isAddedByAddendum: true,
                        addedByAddendumNumber: addendum.number,
                        variation: {
                            quantity: Number(op.newQuantity) || 0,
                            quantityPercent: 100,
                            value: Number(op.operationValue) || 0,
                            valuePercent: 100
                        }
                    });
                }
            }

            res.json({
                items: [...vigentItems, ...addedItems],
                addendums: addendums.map(a => ({
                    id: a.id,
                    number: a.number,
                    description: a.description,
                    date: a.date,
                    totalAddition: a.totalAddition,
                    totalSuppression: a.totalSuppression,
                    netValue: a.netValue
                }))
            });
        } catch (e: any) {
            console.error(e);
            res.status(500).json({ error: e.message });
        }
    }

    // Helper: Recalculate addendum totals
    private static async recalculateTotals(addendumId: string) {
        const operations = await prisma.addendumOperation.findMany({
            where: { addendumId }
        });

        let totalAddition = 0;
        let totalSuppression = 0;

        for (const op of operations) {
            const value = Number(op.operationValue);
            if (value > 0) {
                totalAddition += value;
            } else {
                totalSuppression += Math.abs(value);
            }
        }

        await prisma.contractAddendum.update({
            where: { id: addendumId },
            data: {
                totalAddition: new Decimal(totalAddition),
                totalSuppression: new Decimal(totalSuppression),
                netValue: new Decimal(totalAddition - totalSuppression)
            }
        });
    }
}
