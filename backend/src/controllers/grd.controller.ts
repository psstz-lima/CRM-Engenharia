import { Request, Response } from 'express';

import prisma from '../config/database';

import { ContractEventService } from '../services/contract-event.service';



export class GRDController {

    // Listar GRDs por contrato

    static async list(req: Request, res: Response) {

        try {

            const { contractId } = req.params;

            const { status } = req.query;



            const where: any = {};

            if (contractId) where.contractId = contractId;

            if (status) where.status = status;



            const grds = await prisma.gRD.findMany({

                where,

                include: {

                    contract: { select: { number: true, company: { select: { name: true } } } },

                    items: { include: { document: { select: { code: true, title: true, revision: true } } } },

                    _count: { select: { items: true } }

                },

                orderBy: { createdAt: 'desc' }

            });



            res.json(grds);

        } catch (e: any) {

            res.status(500).json({ error: e.message });

        }

    }



    // Detalhes da GRD

    static async getById(req: Request, res: Response) {

        try {

            const { id } = req.params;



            const grd = await prisma.gRD.findUnique({

                where: { id },

                include: {

                    contract: { select: { number: true, object: true, company: { select: { name: true } } } },

                    items: {

                        include: {

                            document: {

                                select: { code: true, title: true, revision: true, format: true, category: true }

                            }

                        }

                    }

                }

            });



            if (!grd) {

                return res.status(404).json({ error: 'GRD não encontrada' });

            }



                        await ContractEventService.log(

                grd.contractId,

                "GRD_SENT",

                `GRD enviada: ${grd.number}`,

                { grdId: grd.id },

                (req as any).user?.id

            );

res.json(grd);

        } catch (e: any) {

            res.status(500).json({ error: e.message });

        }

    }



    // Criar GRD

    static async create(req: any, res: Response) {

        try {

            const {

                contractId,

                recipient,

                recipientEmail,

                recipientPhone,

                recipientCompany,

                sendMethod,

                reason,

                notes,

                documentIds

            } = req.body;



            if (!contractId || !recipient || !documentIds?.length) {

                return res.status(400).json({ error: 'contractId, recipient e documentIds são obrigatórios' });

            }



            // Gerar número sequencial

            const year = new Date().getFullYear();

            const lastGRD = await prisma.gRD.findFirst({

                where: { year },

                orderBy: { sequence: 'desc' }

            });

            const sequence = (lastGRD?.sequence || 0) + 1;

            const number = `GRD-${String(sequence).padStart(3, '0')}/${year}`;



            const grd = await prisma.gRD.create({

                data: {

                    contractId,

                    number,

                    year,

                    sequence,

                    recipient,

                    recipientEmail,

                    recipientPhone,

                    recipientCompany,

                    sendMethod: sendMethod || 'EMAIL',

                    reason: reason || 'INITIAL',

                    notes,

                    createdById: req.user?.id,

                    createdByName: req.user?.fullName,

                    items: {

                        create: documentIds.map((docId: string) => ({

                            documentId: docId,

                            copies: 1

                        }))

                    }

                },

                include: {

                    items: { include: { document: true } }

                }

            });



            res.status(201).json(grd);

        } catch (e: any) {

            res.status(500).json({ error: e.message });

        }

    }



    // Atualizar GRD

    static async update(req: Request, res: Response) {

        try {

            const { id } = req.params;

            const { recipient, recipientEmail, recipientPhone, recipientCompany, sendMethod, reason, notes } = req.body;



            const grd = await prisma.gRD.update({

                where: { id },

                data: {

                    recipient,

                    recipientEmail,

                    recipientPhone,

                    recipientCompany,

                    sendMethod,

                    reason,

                    notes

                }

            });



            res.json(grd);

        } catch (e: any) {

            res.status(500).json({ error: e.message });

        }

    }



    // Enviar GRD

    static async send(req: Request, res: Response) {

        try {

            const { id } = req.params;



            const grd = await prisma.gRD.update({

                where: { id },

                data: {

                    status: 'SENT',

                    sentAt: new Date()

                },

                include: { items: { include: { document: true } } }

            });



            // Atualizar status dos documentos para DISTRIBUTED

            await prisma.projectDocument.updateMany({

                where: {

                    id: { in: grd.items.map(i => i.documentId) }

                },

                data: {

                    status: 'DISTRIBUTED',

                    distributedAt: new Date()

                }

            });



            res.json(grd);

        } catch (e: any) {

            res.status(500).json({ error: e.message });

        }

    }



    // Confirmar recebimento

    static async confirm(req: Request, res: Response) {

        try {

            const { id } = req.params;



            const grd = await prisma.gRD.update({

                where: { id },

                data: {

                    status: 'RECEIVED',

                    confirmedAt: new Date()

                }

            });



            res.json(grd);

        } catch (e: any) {

            res.status(500).json({ error: e.message });

        }

    }



    // Adicionar item à GRD

    static async addItem(req: Request, res: Response) {

        try {

            const { id } = req.params;

            const { documentId, copies, format, notes } = req.body;



            const item = await prisma.gRDItem.create({

                data: {

                    grdId: id,

                    documentId,

                    copies: copies || 1,

                    format,

                    notes

                },

                include: { document: true }

            });



            res.status(201).json(item);

        } catch (e: any) {

            res.status(500).json({ error: e.message });

        }

    }



    // Remover item da GRD

    static async removeItem(req: Request, res: Response) {

        try {

            const { id, itemId } = req.params;



            await prisma.gRDItem.delete({

                where: { id: itemId }

            });



            res.json({ message: 'Item removido' });

        } catch (e: any) {

            res.status(500).json({ error: e.message });

        }

    }



    // Cancelar GRD

    static async cancel(req: Request, res: Response) {

        try {

            const { id } = req.params;



            const grd = await prisma.gRD.update({

                where: { id },

                data: { status: 'CANCELLED' }

            });



            res.json(grd);

        } catch (e: any) {

            res.status(500).json({ error: e.message });

        }

    }



    // Dashboard de GRDs

    static async dashboard(req: Request, res: Response) {

        try {

            const [draft, sent, received, pending] = await Promise.all([

                prisma.gRD.count({ where: { status: 'DRAFT' } }),

                prisma.gRD.count({ where: { status: 'SENT' } }),

                prisma.gRD.count({ where: { status: 'RECEIVED' } }),

                prisma.gRD.count({ where: { status: 'PENDING' } })

            ]);



            const recent = await prisma.gRD.findMany({

                take: 5,

                orderBy: { createdAt: 'desc' },

                include: {

                    contract: { select: { number: true } },

                    _count: { select: { items: true } }

                }

            });



            res.json({ stats: { draft, sent, received, pending }, recent });

        } catch (e: any) {

            res.status(500).json({ error: e.message });

        }

    }

}





