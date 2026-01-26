import { Request, Response } from 'express';

import prisma from '../config/database';

import { ContractEventService } from '../services/contract-event.service';



export class ApprovalController {



    // Listar nÃ­veis de aprovaÃ§Ã£o

    static async listLevels(req: Request, res: Response) {

        try {

            const levels = await prisma.approvalLevel.findMany({

                where: { isActive: true },

                orderBy: { level: 'asc' }

            });

            return res.json(levels);

        } catch (e: any) {

            return res.status(500).json({ error: e.message });

        }

    }



    // Criar nÃ­vel de aprovaÃ§Ã£o

    static async createLevel(req: Request, res: Response) {

        try {

            const { name, level, description } = req.body;



            if (!name || !level) {

                return res.status(400).json({ error: 'Campos obrigatÃ³rios: name, level' });

            }



            const approvalLevel = await prisma.approvalLevel.create({

                data: { name, level, description }

            });



            return res.status(201).json(approvalLevel);

        } catch (e: any) {

            return res.status(500).json({ error: e.message });

        }

    }



    // Aprovar mediÃ§Ã£o em um nÃ­vel

    static async approveMeasurement(req: Request, res: Response) {

        try {

            const userId = (req as any).userId;

            const { measurementId, approvalLevelId, notes, signatureHash } = req.body;



            // Buscar usuario

            const user = await prisma.user.findUnique({ where: { id: userId } });

            if (!user) return res.status(404).json({ error: 'UsuÃƒÂ¡rio nÃƒÂ£o encontrado' });



            // Buscar medicao

            const measurement = await prisma.measurement.findUnique({

                where: { id: measurementId },

                include: { approvals: { include: { approvalLevel: true } } }

            });



            if (!measurement) {

                return res.status(404).json({ error: 'MediÃƒÂ§ÃƒÂ£o nÃƒÂ£o encontrada' });

            }



            // Medicao precisa estar fechada para aprovar

            if (measurement.status === 'DRAFT') {

                return res.status(400).json({ error: 'MediÃƒÂ§ÃƒÂ£o precisa estar fechada antes de aprovar' });

            }



            // Verificar fluxo de aprovaÃƒÂ§ÃƒÂ£o por contrato

            const flow = await prisma.contractApprovalFlow.findFirst({

                where: { contractId: measurement.contractId, isActive: true },

                include: {

                    steps: {

                        include: { approvalLevel: true },

                        orderBy: { orderIndex: 'asc' }

                    }

                }

            });



            let requiredSteps: any[] = [];

            let currentStep: any = null;



            if (flow) {

                requiredSteps = flow.steps.filter(s => s.required);

                currentStep = flow.steps.find(s => s.approvalLevelId === approvalLevelId);

                if (!currentStep) {

                    return res.status(400).json({ error: 'Este nÃƒÂ­vel nÃƒÂ£o faz parte do fluxo do contrato' });

                }



                const previousSteps = requiredSteps.filter(s => s.orderIndex < currentStep.orderIndex);

                for (const prev of previousSteps) {

                    const hasApproval = measurement.approvals.some(a => a.approvalLevelId === prev.approvalLevelId);

                    if (!hasApproval) {

                        return res.status(400).json({

                            error: `AprovaÃƒÂ§ÃƒÂ£o do nÃƒÂ­vel "${prev.approvalLevel.name}" ÃƒÂ© necessÃƒÂ¡ria antes`

                        });

                    }

                }

            } else {

                // Fluxo global por nÃƒÂ­vel

                const level = await prisma.approvalLevel.findUnique({ where: { id: approvalLevelId } });

                if (!level) return res.status(404).json({ error: 'NÃƒÂ­vel de aprovaÃƒÂ§ÃƒÂ£o nÃƒÂ£o encontrado' });



                const previousLevels = await prisma.approvalLevel.findMany({

                    where: { level: { lt: level.level }, isActive: true }

                });



                for (const prevLevel of previousLevels) {

                    const hasApproval = measurement.approvals.some(a => a.approvalLevelId === prevLevel.id);

                    if (!hasApproval) {

                        return res.status(400).json({

                            error: `AprovaÃƒÂ§ÃƒÂ£o do nÃƒÂ­vel "${prevLevel.name}" ÃƒÂ© necessÃƒÂ¡ria antes`

                        });

                    }

                }

            }



            // Verificar se jÃƒÂ¡ foi aprovado neste nÃƒÂ­vel

            const existing = measurement.approvals.find(a => a.approvalLevelId === approvalLevelId);

            if (existing) {

                return res.status(400).json({ error: 'MediÃƒÂ§ÃƒÂ£o jÃƒÂ¡ aprovada neste nÃƒÂ­vel' });

            }



            // Criar aprovaÃƒÂ§ÃƒÂ£o

            const approval = await prisma.measurementApproval.create({

                data: {

                    measurementId,

                    approvalLevelId,

                    approvedById: userId,

                    approvedByName: user.fullName,

                    notes,

                    signedAt: signatureHash ?new Date() : null,

                    signatureHash

                },

                include: { approvalLevel: true }

            });



            // Verificar se todas as aprovacoes foram feitas

            let requiredCount = 0;

            if (flow) {

                requiredCount = requiredSteps.length;

            } else {

                const allLevels = await prisma.approvalLevel.findMany({ where: { isActive: true } });

                requiredCount = allLevels.length;

            }



            const allApprovals = await prisma.measurementApproval.count({ where: { measurementId } });



            if (requiredCount > 0 && allApprovals >= requiredCount) {

                await prisma.measurement.update({

                    where: { id: measurementId },

                    data: { status: 'APPROVED' }

                });



                await ContractEventService.log(

                    measurement.contractId,

                    "MEASUREMENT_APPROVED",

                    `MediÃƒÂ§ÃƒÂ£o aprovada: #${measurement.number}`,

                    { measurementId: measurement.id },

                    userId

                );

            }



            return res.json(approval);

        } catch (e: any) {

            return res.status(500).json({ error: e.message });

        }

    }



    // Listar aprovaÃ§Ãµes de uma mediÃ§Ã£o

    static async listApprovals(req: Request, res: Response) {

        try {

            const { measurementId } = req.params;



            const approvals = await prisma.measurementApproval.findMany({

                where: { measurementId },

                include: { approvalLevel: true },

                orderBy: { approvalLevel: { level: 'asc' } }

            });



            return res.json(approvals);

        } catch (e: any) {

            return res.status(500).json({ error: e.message });

        }

    }



    // Atualizar nÃ­vel de aprovaÃ§Ã£o

    static async updateLevel(req: Request, res: Response) {

        try {

            const { id } = req.params;

            const { name, level, description, isActive } = req.body;



            const updated = await prisma.approvalLevel.update({

                where: { id },

                data: {

                    name,

                    level,

                    description,

                    isActive

                }

            });



            return res.json(updated);

        } catch (e: any) {

            return res.status(500).json({ error: e.message });

        }

    }



    // Excluir nÃ­vel de aprovaÃ§Ã£o

    static async deleteLevel(req: Request, res: Response) {

        try {

            const { id } = req.params;



            // Verificar se existem aprovaÃ§Ãµes vinculadas

            const hasApprovals = await prisma.measurementApproval.findFirst({

                where: { approvalLevelId: id }

            });



            if (hasApprovals) {

                return res.status(400).json({ error: 'NÃ£o Ã© possÃ­vel excluir este nÃ­vel pois existem mediÃ§Ãµes aprovadas com ele. Considere inativÃ¡-lo.' });

            }



            await prisma.approvalLevel.delete({

                where: { id }

            });



            return res.status(204).send();

        } catch (e: any) {

            return res.status(500).json({ error: e.message });

        }

    }

}








