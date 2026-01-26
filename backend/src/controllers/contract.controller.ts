import { Request, Response } from 'express';

import prisma from '../config/database';

import { ExcelService } from '../services/excel.service';

import { ContractEventService } from '../services/contract-event.service';



export class ContractController {



    // --- CONTRACTS ---



    static async list(req: Request, res: Response) {

        try {

            const { companyId } = req.query;

            const user: any = (req as any).user;

            const accessFilter = user?.isMaster ? {} : {

                OR: [

                    { accessRoles: { isEmpty: true } },

                    { accessRoles: { has: user?.roleId } }

                ]

            };

            const where = {

                ...(companyId ? { companyId: String(companyId) } : {}),

                ...accessFilter

            };



            const contracts = await prisma.contract.findMany({

                where,

                include: { company: true },

                orderBy: { createdAt: 'desc' }

            });



            res.json(contracts);

        } catch (e: any) {

            res.status(500).json({ error: e.message });

        }

    }



    static async getById(req: Request, res: Response) {

        try {

            const { id } = req.params;

            const contract = await prisma.contract.findUnique({

                where: { id },

                include: { company: true }

            });



            if (!contract) return res.status(404).json({ error: 'Contrato nÃ£o encontrado' });



            // Fetch generic flat items

            const items = await prisma.contractItem.findMany({

                where: { contractId: id },

                orderBy: [

                    { orderIndex: 'asc' },

                    { code: 'asc' },

                    { createdAt: 'asc' }

                ]

            });



            // Build Hierarchy

            const hierarchy = ContractController.buildHierarchy(items);



            res.json({ ...contract, items: hierarchy });

        } catch (e: any) {

            res.status(500).json({ error: e.message });

        }

    }




    static async getAccess(req: any, res: Response) {
        try {
            const { id } = req.params;
            const contract = await prisma.contract.findUnique({ where: { id }, select: { id: true, accessRoles: true } });
            if (!contract) return res.status(404).json({ error: 'Contrato n?o encontrado' });

            const user: any = (req as any).user;
            if (!user?.isMaster && contract.accessRoles?.length) {
                if (!contract.accessRoles.includes(user.roleId)) {
                    return res.status(403).json({ error: 'Acesso negado ao contrato' });
                }
            }

            return res.json(contract);
        } catch (e: any) {
            return res.status(500).json({ error: e.message });
        }
    }

    static async updateAccess(req: any, res: Response) {
        try {
            const { id } = req.params;
            const { accessRoles } = req.body;
            if (!Array.isArray(accessRoles)) {
                return res.status(400).json({ error: 'accessRoles deve ser uma lista' });
            }
            const contract = await prisma.contract.update({
                where: { id },
                data: { accessRoles }
            });
            return res.json(contract);
        } catch (e: any) {
            return res.status(500).json({ error: e.message });
        }
    }

    static async create(req: Request, res: Response) {

        try {

            const { number, object, companyId, startDate, endDate } = req.body;

            if (!number || !companyId || !startDate || !endDate) {

                return res.status(400).json({ error: 'number, companyId, startDate e endDate sÃƒÂ£o obrigatÃƒÂ³rios' });

            }



            const start = new Date(startDate);

            const end = new Date(endDate);

            if (isNaN(start.getTime()) || isNaN(end.getTime())) {

                return res.status(400).json({ error: 'Datas inválidas' });

            }

            if (start > end) {

                return res.status(400).json({ error: 'Data de início não pode ser maior que a data de fim' });

            }



            const existing = await prisma.contract.findUnique({ where: { number } });

            if (existing) return res.status(400).json({ error: 'Número de contrato já existe' });



            const contract = await prisma.contract.create({

                data: {

                    number,

                    object,

                    companyId,

                    startDate: start,

                    endDate: end,

                    totalValue: 0 // Initial value is 0

                }

            });



            await ContractEventService.log(

                contract.id,

                'CONTRACT_CREATED',

                `Contrato criado: ${contract.number}`,

                null,

                (req as any).user?.id

            );



            res.status(201).json(contract);

        } catch (e: any) {

            res.status(500).json({ error: e.message });

        }

    }



    static async update(req: Request, res: Response) {

        try {

            const { id } = req.params;

            const data = req.body;



            if (data.startDate) {

                const start = new Date(data.startDate);

                if (isNaN(start.getTime())) {

                    return res.status(400).json({ error: 'startDate invalida' });

                }

                data.startDate = start;

            }

            if (data.endDate) {

                const end = new Date(data.endDate);

                if (isNaN(end.getTime())) {

                    return res.status(400).json({ error: 'endDate invalida' });

                }

                data.endDate = end;

            }

            if (data.startDate && data.endDate && data.startDate > data.endDate) {

                return res.status(400).json({ error: 'Data de início não pode ser maior que a data de fim' });

            }



            const contract = await prisma.contract.update({

                where: { id },

                data

            });



            await ContractEventService.log(

                contract.id,

                'CONTRACT_UPDATED',

                `Contrato atualizado: ${contract.number}`,

                null,

                (req as any).user?.id

            );

            res.json(contract);

        } catch (e: any) {

            res.status(500).json({ error: e.message });

        }

    }



    static async delete(req: Request, res: Response) {

        try {

            const { id } = req.params;

            const contract = await prisma.contract.findUnique({ where: { id } });

            if (!contract) return res.status(404).json({ error: 'Contrato nÃ£o encontrado' });



            await prisma.contract.delete({ where: { id } });

            res.status(204).send();

        } catch (e: any) {

            res.status(500).json({ error: e.message });

        }

    }



    static async downloadTemplate(req: Request, res: Response) {

        try {

            const buffer = await ExcelService.generateTemplate();

            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

            res.setHeader('Content-Disposition', 'attachment; filename=modelo_importacao_contrato.xlsx');

            res.send(buffer);

        } catch (e: any) {

            res.status(500).json({ error: e.message });

        }

    }



    // --- ITEMS ---



    static async addItem(req: Request, res: Response) {

        try {

            const { contractId } = req.params;

            const {

                type, parentId, code, description,

                quantity, unit, unitPrice, costCenter, techSpecs

            } = req.body;



            // Hierarchy Validation Rules

            const typeOrder: Record<string, number> = {

                'STAGE': 1,

                'SUBSTAGE': 2,

                'LEVEL': 3,

                'SUBLEVEL': 4,

                'GROUP': 5,

                'SUBGROUP': 6,

                'ITEM': 7

            };



            if (type === 'STAGE') {

                if (parentId) return res.status(400).json({ error: 'Etapa (STAGE) nÃ£o pode ter pai' });

            } else {

                if (!parentId) return res.status(400).json({ error: `${type} deve ter um pai` });



                const parent = await prisma.contractItem.findUnique({ where: { id: parentId } });

                if (!parent) return res.status(404).json({ error: 'Item pai nÃ£o encontrado' });



                const parentOrder = typeOrder[parent.type];

                const childOrder = typeOrder[type];



                if (!parentOrder || !childOrder) return res.status(400).json({ error: 'Tipo de item invÃ¡lido' });



                if (childOrder <= parentOrder) {

                    return res.status(400).json({ error: `${type} nÃ£o pode ser filho de ${parent.type} (deve ser um nÃ­vel inferior)` });

                }

            }



            // Calculate Total for Leaf Node (ITEM)

            let totalValue = 0;

            if (type === 'ITEM') {

                totalValue = (Number(quantity) || 0) * (Number(unitPrice) || 0);

            }



            // Calculate OrderIndex (Last + 1 in the same parent scope)

            const lastItem = await prisma.contractItem.findFirst({

                where: { contractId, parentId },

                orderBy: { orderIndex: 'desc' }

            });

            const orderIndex = (lastItem?.orderIndex || 0) + 1;



            const item = await prisma.contractItem.create({

                data: {

                    contractId,

                    parentId,

                    type,

                    code,

                    description,

                    orderIndex,

                    quantity: quantity ?Number(quantity) : null,

                    unit,

                    unitPrice: unitPrice ?Number(unitPrice) : null,

                    totalValue,

                    costCenter,

                    techSpecs

                }

            });



            if (type === 'ITEM') {

                await ContractController.recalculateContractTotal(contractId);

            }



            res.status(201).json(item);

        } catch (e: any) {

            res.status(500).json({ error: e.message });

        }

    }



    static async updateItem(req: Request, res: Response) {

        try {

            const { id } = req.params;

            const data = req.body;



            const currentItem = await prisma.contractItem.findUnique({ where: { id } });

            if (!currentItem) return res.status(404).json({ error: 'Item não encontrado' });

            if (typeof data.measurementCriteria === 'string' && data.measurementCriteria.trim() === '') {
                data.measurementCriteria = null;
            }



            // Calculate new total if quantity/price changes

            if (currentItem.type === 'ITEM') {

                const qty = data.quantity !== undefined ?Number(data.quantity) : Number(currentItem.quantity);

                const price = data.unitPrice !== undefined ?Number(data.unitPrice) : Number(currentItem.unitPrice);

                data.totalValue = qty * price;

            }



            const item = await prisma.contractItem.update({

                where: { id },

                data

            });



            if (currentItem.type === 'ITEM') {

                await ContractController.recalculateContractTotal(item.contractId);

            }



            res.json(item);

        } catch (e: any) {

            res.status(500).json({ error: e.message });

        }

    }



    static async deleteItem(req: Request, res: Response) {

        try {

            const { id } = req.params;

            const item = await prisma.contractItem.findUnique({ where: { id } });

            if (!item) return res.status(404).json({ error: 'Item nÃ£o encontrado' });



            await prisma.contractItem.delete({ where: { id } });



            if (item.type === 'ITEM') {

                await ContractController.recalculateContractTotal(item.contractId);

            }



            res.status(204).send();

        } catch (e: any) {

            res.status(500).json({ error: e.message });

        }

    }



    static async reorderItems(req: Request, res: Response) {

        try {

            const { items } = req.body; // Array of { id, orderIndex }



            if (!Array.isArray(items)) {

                return res.status(400).json({ error: 'Formato invÃ¡lido' });

            }



            // Verify existence first

            const ids = items.map((i: any) => i.id);

            const foundItems = await prisma.contractItem.findMany({

                where: { id: { in: ids } },

                select: { id: true }

            });

            const foundIds = new Set(foundItems.map(i => i.id));



            // Filter to only valid items

            const validItems = items.filter((i: any) => foundIds.has(i.id));



            if (validItems.length === 0) {

                return res.status(404).json({ error: 'Nenhum item vÃ¡lido encontrado' });

            }



            // Execute in transaction with only valid items

            console.log('Reordering items:', validItems);

            await prisma.$transaction(

                validItems.map((item: any) =>

                    prisma.contractItem.update({

                        where: { id: item.id },

                        data: { orderIndex: item.orderIndex }

                    })

                )

            );

            console.log('Reorder complete');



            res.status(200).send();

        } catch (e: any) {

            console.error(e);

            res.status(500).json({ error: e.message });

        }

    }







    // --- HELPERS ---



    private static buildHierarchy(items: any[]) {

        const itemMap = new Map();

        const roots: any[] = [];



        items.forEach(item => {

            item.children = [];

            itemMap.set(item.id, item);

        });



        items.forEach(item => {

            if (item.parentId) {

                const parent = itemMap.get(item.parentId);

                if (parent) {

                    parent.children.push(item);

                }

            } else {

                roots.push(item);

            }

        });



        // Sort children arrays by orderIndex to ensure correct order after hierarchy build

        const sortChildren = (nodes: any[]) => {

            nodes.sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));

            nodes.forEach(node => {

                if (node.children && node.children.length > 0) {

                    sortChildren(node.children);

                }

            });

        };

        sortChildren(roots);



        return roots;

    }



    private static async recalculateContractTotal(contractId: string) {

        const aggregations = await prisma.contractItem.aggregate({

            where: { contractId, type: 'ITEM' },

            _sum: { totalValue: true }

        });



        await prisma.contract.update({

            where: { id: contractId },

            data: { totalValue: aggregations._sum.totalValue || 0 }

        });

    }



    // --- EXCEL ---



    static async exportExcel(req: Request, res: Response) {

        try {

            const { id } = req.params;

            const buffer = await ExcelService.generateContractExcel(id);



            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

            res.setHeader('Content-Disposition', `attachment; filename=contract-${id}.xlsx`);

            res.send(buffer);

        } catch (e: any) {

            res.status(500).json({ error: e.message });

        }

    }



    static async importExcel(req: Request, res: Response) {

        try {

            const { id } = req.params;

            if (!req.file) return res.status(400).json({ error: 'Arquivo invÃ¡lido' });



            await ExcelService.importContractExcel(id, req.file.buffer);

            res.status(200).json({ message: 'Importa?o conclu?da com sucesso' });

        } catch (e: any) {

            res.status(500).json({ error: e.message });

        }

    }

}






