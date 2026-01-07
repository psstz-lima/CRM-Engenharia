import { Request, Response } from 'express';
import prisma from '../config/database';

export class DashboardController {
    // Medições por mês (últimos 6 meses)
    static async getTimeline(req: Request, res: Response) {
        try {
            const sixMonthsAgo = new Date();
            sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

            const measurements = await prisma.measurement.findMany({
                where: { createdAt: { gte: sixMonthsAgo } },
                select: { createdAt: true, status: true }
            });

            // Agrupar por mês
            const monthlyData: Record<string, { total: number; approved: number; closed: number; draft: number }> = {};
            
            for (let i = 5; i >= 0; i--) {
                const date = new Date();
                date.setMonth(date.getMonth() - i);
                const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                monthlyData[key] = { total: 0, approved: 0, closed: 0, draft: 0 };
            }

            measurements.forEach(m => {
                const key = `${m.createdAt.getFullYear()}-${String(m.createdAt.getMonth() + 1).padStart(2, '0')}`;
                if (monthlyData[key]) {
                    monthlyData[key].total++;
                    if (m.status === 'APPROVED') monthlyData[key].approved++;
                    else if (m.status === 'CLOSED') monthlyData[key].closed++;
                    else monthlyData[key].draft++;
                }
            });

            const timeline = Object.entries(monthlyData).map(([month, data]) => ({
                month,
                label: new Date(month + '-01').toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }),
                ...data
            }));

            res.json(timeline);
        } catch (e: any) {
            res.status(500).json({ error: e.message });
        }
    }

    // Top 5 contratos por valor
    static async getTopContracts(req: Request, res: Response) {
        try {
            const contracts = await prisma.contract.findMany({
                where: { isActive: true },
                orderBy: { totalValue: 'desc' },
                take: 5,
                include: { company: { select: { name: true } } }
            });

            // Calcular valor medido por contrato
            const contractsWithMeasured = await Promise.all(
                contracts.map(async (c) => {
                    const measured = await prisma.measurementItem.aggregate({
                        where: { 
                            measurement: { contractId: c.id },
                            contractItem: { type: 'ITEM' }
                        },
                        _sum: { measuredQuantity: true }
                    });

                    // Calcular percentual executado
                    const items = await prisma.contractItem.aggregate({
                        where: { contractId: c.id, type: 'ITEM' },
                        _sum: { quantity: true }
                    });

                    const totalQty = Number(items._sum.quantity) || 1;
                    const measuredQty = Number(measured._sum.measuredQuantity) || 0;
                    const percent = Math.min((measuredQty / totalQty) * 100, 100);

                    return {
                        id: c.id,
                        number: c.number,
                        company: c.company.name,
                        totalValue: Number(c.totalValue),
                        percentExecuted: percent.toFixed(1)
                    };
                })
            );

            res.json(contractsWithMeasured);
        } catch (e: any) {
            res.status(500).json({ error: e.message });
        }
    }

    // Contratos vencendo nos próximos 30 dias
    static async getExpiringContracts(req: Request, res: Response) {
        try {
            const today = new Date();
            const thirtyDaysFromNow = new Date();
            thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

            const expiring = await prisma.contract.findMany({
                where: {
                    isActive: true,
                    endDate: { gte: today, lte: thirtyDaysFromNow }
                },
                include: { company: { select: { name: true } } },
                orderBy: { endDate: 'asc' }
            });

            res.json(expiring.map(c => ({
                id: c.id,
                number: c.number,
                company: c.company.name,
                endDate: c.endDate,
                daysRemaining: Math.ceil((c.endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
            })));
        } catch (e: any) {
            res.status(500).json({ error: e.message });
        }
    }

    // Medições pendentes de aprovação
    static async getPendingApprovals(req: Request, res: Response) {
        try {
            const pending = await prisma.measurement.findMany({
                where: { status: 'CLOSED' },
                include: {
                    contract: { select: { number: true, company: { select: { name: true } } } }
                },
                orderBy: { updatedAt: 'desc' },
                take: 10
            });

            res.json(pending.map(m => ({
                id: m.id,
                contractNumber: m.contract.number,
                company: m.contract.company.name,
                number: m.number,
                periodEnd: m.periodEnd,
                status: m.status
            })));
        } catch (e: any) {
            res.status(500).json({ error: e.message });
        }
    }

    static async getStats(req: Request, res: Response) {
        try {
            // Contagens gerais
            const [
                totalContracts,
                activeContracts,
                totalMeasurements,
                openMeasurements,
                closedMeasurements,
                approvedMeasurements,
                totalCompanies,
                totalUsers
            ] = await Promise.all([
                prisma.contract.count(),
                prisma.contract.count({ where: { isActive: true } }),
                prisma.measurement.count(),
                prisma.measurement.count({ where: { status: 'DRAFT' } }),
                prisma.measurement.count({ where: { status: 'CLOSED' } }),
                prisma.measurement.count({ where: { status: 'APPROVED' } }),
                prisma.company.count(),
                prisma.user.count({ where: { isActive: true } })
            ]);

            // Valores totais de contratos
            const contractValues = await prisma.contract.aggregate({
                _sum: { totalValue: true }
            });

            // Valores medidos (soma de itens de medição)
            const measurementValues = await prisma.measurementItem.aggregate({
                _sum: { measuredQuantity: true }
            });

            // Medições recentes (últimos 30 dias)
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            const recentMeasurements = await prisma.measurement.count({
                where: { createdAt: { gte: thirtyDaysAgo } }
            });

            // Contratos por empresa (top 5)
            const contractsByCompany = await prisma.contract.groupBy({
                by: ['companyId'],
                _count: { id: true },
                _sum: { totalValue: true },
                orderBy: { _count: { id: 'desc' } },
                take: 5
            });

            // Buscar nomes das empresas
            const companyIds = contractsByCompany.map(c => c.companyId);
            const companies = await prisma.company.findMany({
                where: { id: { in: companyIds } },
                select: { id: true, name: true }
            });
            const companyMap = new Map(companies.map(c => [c.id, c.name]));

            const contractsByCompanyWithNames = contractsByCompany.map(c => ({
                companyName: companyMap.get(c.companyId) || 'Desconhecida',
                count: c._count.id,
                totalValue: c._sum.totalValue || 0
            }));

            // Medições por status
            const measurementsByStatus = [
                { status: 'Rascunho', count: openMeasurements, color: '#3b82f6' },
                { status: 'Fechada', count: closedMeasurements, color: '#f59e0b' },
                { status: 'Aprovada', count: approvedMeasurements, color: '#10b981' }
            ];

            res.json({
                totals: {
                    contracts: totalContracts,
                    activeContracts,
                    measurements: totalMeasurements,
                    openMeasurements,
                    closedMeasurements,
                    approvedMeasurements,
                    companies: totalCompanies,
                    users: totalUsers,
                    contractValue: contractValues._sum.totalValue || 0,
                    recentMeasurements
                },
                charts: {
                    contractsByCompany: contractsByCompanyWithNames,
                    measurementsByStatus
                }
            });
        } catch (e: any) {
            res.status(500).json({ error: e.message });
        }
    }
}
