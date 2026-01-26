import { Request, Response } from 'express';
import prisma from '../config/database';
import ExcelJS from 'exceljs';

export class ReportController {
    // Resumo financeiro de contrato (JSON)
    static async contractFinancial(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const contract = await prisma.contract.findUnique({
                where: { id },
                include: { company: true }
            });

            if (!contract) {
                return res.status(404).json({ error: 'Contrato não encontrado' });
            }

            const measuredItems = await prisma.measurementItem.findMany({
                where: {
                    measurement: {
                        contractId: id,
                        status: { in: ['CLOSED', 'APPROVED'] }
                    }
                },
                select: {
                    measuredQuantity: true,
                    currentPrice: true
                }
            });

            const measuredValue = measuredItems.reduce((acc, item) => {
                const qty = Number(item.measuredQuantity || 0);
                const price = Number(item.currentPrice || 0);
                return acc + (qty * price);
            }, 0);

            const totalValue = Number(contract.totalValue || 0);
            const remainingValue = totalValue - measuredValue;
            const percentExecuted = totalValue > 0 ? (measuredValue / totalValue) * 100 : 0;

            return res.json({
                contract: {
                    id: contract.id,
                    number: contract.number,
                    company: contract.company.name
                },
                totalValue,
                measuredValue,
                remainingValue,
                percentExecuted: Number(percentExecuted.toFixed(2))
            });
        } catch (e: any) {
            return res.status(500).json({ error: e.message });
        }
    }
    // Exportar medição para Excel
    static async measurementToExcel(req: Request, res: Response) {
        try {
            const { id } = req.params;

            const measurement = await prisma.measurement.findUnique({
                where: { id },
                include: {
                    contract: {
                        include: {
                            company: true,
                            items: { where: { type: 'ITEM' } }
                        }
                    },
                    items: {
                        include: {
                            contractItem: true,
                            memories: true
                        }
                    }
                }
            });

            if (!measurement) {
                return res.status(404).json({ error: 'Medição não encontrada' });
            }

            const workbook = new ExcelJS.Workbook();
            workbook.creator = 'CRM Engenharia';
            workbook.created = new Date();

            // Sheet: Resumo
            const resumoSheet = workbook.addWorksheet('Resumo', {
                properties: { tabColor: { argb: '10B981' } }
            });

            // Header
            resumoSheet.mergeCells('A1:F1');
            resumoSheet.getCell('A1').value = 'BOLETIM DE MEDIÇÃO';
            resumoSheet.getCell('A1').font = { bold: true, size: 16 };
            resumoSheet.getCell('A1').alignment = { horizontal: 'center' };

            // Info do contrato
            resumoSheet.addRow([]);
            resumoSheet.addRow(['Contrato:', measurement.contract.number]);
            resumoSheet.addRow(['Empresa:', measurement.contract.company.name]);
            resumoSheet.addRow(['Medição Nº:', measurement.number]);
            resumoSheet.addRow(['Período:', `${new Date(measurement.periodStart).toLocaleDateString('pt-BR')} a ${new Date(measurement.periodEnd).toLocaleDateString('pt-BR')}`]);
            resumoSheet.addRow(['Status:', measurement.status]);
            resumoSheet.addRow([]);

            // Sheet: Itens Medidos
            const itensSheet = workbook.addWorksheet('Itens Medidos', {
                properties: { tabColor: { argb: '3B82F6' } }
            });

            // Header da tabela
            itensSheet.addRow(['Código', 'Descrição', 'Unidade', 'Qtd Contrato', 'Qtd Medida', 'Acumulado', 'Preço Unit.', 'Valor']);
            itensSheet.getRow(1).font = { bold: true };
            itensSheet.getRow(1).fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: '3B82F6' }
            };
            itensSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' } };

            // Dados
            let totalValue = 0;
            measurement.items.forEach(item => {
                const contractItem = item.contractItem;
                const measuredQty = Number(item.measuredQuantity);
                const price = Number(item.currentPrice);
                const value = measuredQty * price;
                totalValue += value;

                itensSheet.addRow([
                    contractItem.code || '-',
                    contractItem.description || '-',
                    contractItem.unit || '-',
                    Number(contractItem.quantity) || 0,
                    measuredQty,
                    Number(item.accumulatedQuantity),
                    price,
                    value
                ]);
            });

            // Total
            itensSheet.addRow([]);
            itensSheet.addRow(['', '', '', '', '', '', 'TOTAL:', totalValue]);
            const lastRow = itensSheet.lastRow!;
            lastRow.font = { bold: true };
            lastRow.getCell(8).numFmt = '"R$"#,##0.00';

            // Formatação de colunas
            itensSheet.columns = [
                { width: 12 },
                { width: 40 },
                { width: 10 },
                { width: 15 },
                { width: 15 },
                { width: 15 },
                { width: 15 },
                { width: 18 }
            ];

            // Formato numérico
            itensSheet.getColumn(7).numFmt = '"R$"#,##0.00';
            itensSheet.getColumn(8).numFmt = '"R$"#,##0.00';

            // Sheet: Memória de Cálculo
            if (measurement.items.some(i => i.memories.length > 0)) {
                const memoriaSheet = workbook.addWorksheet('Memória de Cálculo', {
                    properties: { tabColor: { argb: 'F59E0B' } }
                });

                memoriaSheet.addRow(['Item', 'Trecho/Descrição', 'Estaca Inicial', 'Estaca Final', 'Extensão', 'Largura', 'Altura', 'Quantidade']);
                memoriaSheet.getRow(1).font = { bold: true };
                memoriaSheet.getRow(1).fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'F59E0B' }
                };

                measurement.items.forEach(item => {
                    item.memories.forEach(mem => {
                        memoriaSheet.addRow([
                            item.contractItem.code || '-',
                            mem.description || '-',
                            Number(mem.startPoint) || '-',
                            Number(mem.endPoint) || '-',
                            Number(mem.length) || '-',
                            Number(mem.width) || '-',
                            Number(mem.height) || '-',
                            Number(mem.quantity)
                        ]);
                    });
                });

                memoriaSheet.columns = [
                    { width: 12 },
                    { width: 30 },
                    { width: 15 },
                    { width: 15 },
                    { width: 12 },
                    { width: 12 },
                    { width: 12 },
                    { width: 15 }
                ];
            }

            // Resposta
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename=medicao_${measurement.number}_${measurement.contract.number}.xlsx`);

            await workbook.xlsx.write(res);
            res.end();
        } catch (e: any) {
            console.error('Erro ao gerar Excel:', e);
            res.status(500).json({ error: e.message });
        }
    }

    // Exportar resumo de contrato para Excel
    static async contractSummaryToExcel(req: Request, res: Response) {
        try {
            const { id } = req.params;

            const contract = await prisma.contract.findUnique({
                where: { id },
                include: {
                    company: true,
                    items: { orderBy: { orderIndex: 'asc' } },
                    measurements: {
                        include: { items: true },
                        orderBy: { number: 'asc' }
                    }
                }
            });

            if (!contract) {
                return res.status(404).json({ error: 'Contrato não encontrado' });
            }

            const workbook = new ExcelJS.Workbook();
            workbook.creator = 'CRM Engenharia';

            // Sheet: Resumo do Contrato
            const sheet = workbook.addWorksheet('Resumo');

            sheet.mergeCells('A1:G1');
            sheet.getCell('A1').value = `CONTRATO ${contract.number}`;
            sheet.getCell('A1').font = { bold: true, size: 16 };
            sheet.getCell('A1').alignment = { horizontal: 'center' };

            sheet.addRow([]);
            sheet.addRow(['Empresa:', contract.company.name]);
            sheet.addRow(['Objeto:', contract.object || '-']);
            sheet.addRow(['Vigência:', `${new Date(contract.startDate).toLocaleDateString('pt-BR')} a ${new Date(contract.endDate).toLocaleDateString('pt-BR')}`]);
            sheet.addRow(['Valor Total:', Number(contract.totalValue)]);
            sheet.getRow(6).getCell(2).numFmt = '"R$"#,##0.00';
            sheet.addRow(['Total de Medições:', contract.measurements.length]);
            sheet.addRow([]);

            // Tabela de itens
            sheet.addRow(['Código', 'Descrição', 'Tipo', 'Unidade', 'Qtd Contrato', 'Preço Unit.', 'Valor Total']);
            sheet.getRow(9).font = { bold: true };

            contract.items.filter(i => i.type === 'ITEM').forEach(item => {
                sheet.addRow([
                    item.code || '-',
                    item.description || '-',
                    item.type,
                    item.unit || '-',
                    Number(item.quantity) || 0,
                    Number(item.unitPrice) || 0,
                    Number(item.totalValue) || 0
                ]);
            });

            sheet.columns = [
                { width: 12 },
                { width: 40 },
                { width: 10 },
                { width: 10 },
                { width: 15 },
                { width: 15 },
                { width: 18 }
            ];

            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename=contrato_${contract.number}.xlsx`);

            await workbook.xlsx.write(res);
            res.end();
        } catch (e: any) {
            res.status(500).json({ error: e.message });
        }
    }

    // Relatório geral de medições (por período)
    static async measurementsReport(req: Request, res: Response) {
        try {
            const { startDate, endDate, status } = req.query;

            const where: any = {};
            if (startDate && endDate) {
                where.periodStart = { gte: new Date(startDate as string) };
                where.periodEnd = { lte: new Date(endDate as string) };
            }
            if (status) {
                where.status = status;
            }

            const measurements = await prisma.measurement.findMany({
                where,
                include: {
                    contract: { include: { company: true } },
                    items: { include: { contractItem: true } }
                },
                orderBy: { createdAt: 'desc' }
            });

            const workbook = new ExcelJS.Workbook();
            const sheet = workbook.addWorksheet('Relatório de Medições');

            sheet.addRow(['Contrato', 'Empresa', 'Medição Nº', 'Período', 'Status', 'Qtd Itens', 'Data Criação']);
            sheet.getRow(1).font = { bold: true };
            sheet.getRow(1).fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: '10B981' }
            };
            sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' } };

            measurements.forEach(m => {
                sheet.addRow([
                    m.contract.number,
                    m.contract.company.name,
                    m.number,
                    `${new Date(m.periodStart).toLocaleDateString('pt-BR')} - ${new Date(m.periodEnd).toLocaleDateString('pt-BR')}`,
                    m.status,
                    m.items.length,
                    new Date(m.createdAt).toLocaleDateString('pt-BR')
                ]);
            });

            sheet.columns = [
                { width: 15 },
                { width: 30 },
                { width: 12 },
                { width: 30 },
                { width: 12 },
                { width: 12 },
                { width: 15 }
            ];

            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename=relatorio_medicoes_${new Date().toISOString().split('T')[0]}.xlsx`);

            await workbook.xlsx.write(res);
            res.end();
        } catch (e: any) {
            res.status(500).json({ error: e.message });
        }
    }
}
