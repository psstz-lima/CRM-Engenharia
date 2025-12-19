import ExcelJS from 'exceljs';
import { ContractItem } from '@prisma/client';
import prisma from '../config/database';

export class ExcelService {
    static async generateTemplate(): Promise<Buffer> {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Modelo de Importação');

        // Headers (same as export format)
        worksheet.columns = [
            { header: 'Tipo', key: 'type', width: 15 },
            { header: 'Código', key: 'code', width: 15 },
            { header: 'Descrição', key: 'description', width: 50 },
            { header: 'Unidade', key: 'unit', width: 10 },
            { header: 'Quantidade', key: 'quantity', width: 15 },
            { header: 'Preço Unit.', key: 'unitPrice', width: 15 },
            { header: 'Total', key: 'totalValue', width: 15 },
            { header: 'Centro de Custo', key: 'costCenter', width: 15 },
            { header: 'Specs', key: 'techSpecs', width: 20 },
        ];

        // Style Header
        const headerRow = worksheet.getRow(1);
        headerRow.font = { bold: true, color: { argb: 'FFFFFF' } };
        headerRow.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: '2563EB' }
        };

        // Add example rows based on actual working format
        const examples = [
            { type: 'ETAPA', code: 'A.', description: 'Custos Indiretos', unit: '', quantity: null, unitPrice: null, totalValue: null, costCenter: '', techSpecs: '' },
            { type: 'SUB-ETAPA', code: 'A.1', description: 'Atividades Preliminares e de Apoio', unit: '', quantity: null, unitPrice: null, totalValue: null, costCenter: '', techSpecs: '' },
            { type: 'ITEM', code: '', description: 'Administração Local', unit: 'un', quantity: 1, unitPrice: 150000.00, totalValue: 150000.00, costCenter: '', techSpecs: '' },
            { type: 'ETAPA', code: 'B.', description: 'Trabalhos Iniciais', unit: '', quantity: null, unitPrice: null, totalValue: null, costCenter: '', techSpecs: '' },
            { type: 'SUB-ETAPA', code: 'B.1', description: 'Canteiro e Faixa de Domínio', unit: '', quantity: null, unitPrice: null, totalValue: null, costCenter: '', techSpecs: '' },
            { type: 'ITEM', code: 'C44075', description: 'Revestimento vegetal com mudas', unit: 'm2', quantity: 118529, unitPrice: 23.78, totalValue: 2818499.62, costCenter: '', techSpecs: '' },
            { type: 'ITEM', code: 'C37016', description: 'Cerca de arame farpado', unit: 'm', quantity: 5000, unitPrice: 45.00, totalValue: 225000.00, costCenter: '', techSpecs: '' },
            { type: 'SUB-ETAPA', code: 'B.2', description: 'Obras-de-Arte Especiais', unit: '', quantity: null, unitPrice: null, totalValue: null, costCenter: '', techSpecs: '' },
            { type: 'ITEM', code: 'C52001', description: 'Balizador cônico refletivo', unit: 'un', quantity: 342, unitPrice: 35.50, totalValue: 12141.00, costCenter: '', techSpecs: '' },
        ];

        examples.forEach(ex => worksheet.addRow(ex));

        // Add instructions worksheet
        const instrSheet = workbook.addWorksheet('Instruções');
        instrSheet.columns = [{ header: 'Instruções de Preenchimento', key: 'text', width: 80 }];
        instrSheet.getRow(1).font = { bold: true, size: 14 };

        const instructions = [
            '',
            'TIPOS VÁLIDOS (coluna Tipo):',
            '  • ETAPA - Etapa principal',
            '  • SUB-ETAPA - Sub-etapa',
            '  • GRUPO - Grupo',
            '  • SUB-GRUPO - Sub-grupo',
            '  • ITEM - Item final (serviço/material)',
            '',
            'CÓDIGO:',
            '  • Use notação hierárquica (ex: A., A.1, B., B.1)',
            '  • O sistema detecta automaticamente o pai pelo código',
            '',
            'CAMPOS OBRIGATÓRIOS PARA ITEM:',
            '  • Unidade, Quantidade e Preço Unitário',
            '',
            'OBSERVAÇÕES:',
            '  • A coluna Total é calculada automaticamente (Qtd x Preço)',
            '  • A importação SUBSTITUI todos os itens existentes no contrato',
        ];

        instructions.forEach(text => instrSheet.addRow({ text }));

        return await workbook.xlsx.writeBuffer() as unknown as Buffer;
    }

    static async generateContractExcel(contractId: string): Promise<Buffer> {
        const contract = await prisma.contract.findUnique({
            where: { id: contractId },
            include: { company: true }
        });

        if (!contract) throw new Error('Contrato não encontrado');

        const items = await prisma.contractItem.findMany({
            where: { contractId },
            orderBy: { code: 'asc' } // Ensure logical order
        });

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Planilha Orçamentária');

        // Headers
        worksheet.columns = [
            { header: 'Tipo', key: 'type', width: 15 },
            { header: 'Código', key: 'code', width: 15 },
            { header: 'Descrição', key: 'description', width: 50 },
            { header: 'Unidade', key: 'unit', width: 10 },
            { header: 'Quantidade', key: 'quantity', width: 15 },
            { header: 'Preço Unit.', key: 'unitPrice', width: 15 },
            { header: 'Total', key: 'totalValue', width: 15 },
            { header: 'Centro de Custo', key: 'costCenter', width: 15 },
            { header: 'Specs', key: 'techSpecs', width: 20 },
        ];

        // Styling Header
        worksheet.getRow(1).font = { bold: true };

        // Add Data
        items.forEach(item => {
            const row = worksheet.addRow({
                type: item.type,
                code: item.code,
                description: item.description, // We could add indentation here visually if wanted, but raw data is better for re-import
                unit: item.unit,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                totalValue: item.totalValue,
                costCenter: item.costCenter,
                techSpecs: item.techSpecs
            });

            // Visual Indentation (optional, nice for user)
            // We can infer level from type or code dots
            const level = ((item.code || '').match(/\./g) || []).length;
            if (level > 0) {
                row.getCell('description').alignment = { indent: level };
            }
        });

        return await workbook.xlsx.writeBuffer() as unknown as Buffer;
    }

    static async importContractExcel(contractId: string, buffer: Buffer) {
        // First delete existing items? Or update?
        // User request implied "Import", typically replacing or appending.
        // For simplicity and safety in maintaining hierarchy integrity, let's assume valid "Code" based Upsert or Clean Insert.
        // Let's go with: Delete All and Re-create is dangerous.
        // Let's go with: Create items. If 'Code' exists, maybe skip or error?
        // For this MVP: We will simply create new items. The user should probably clear the contract first or we provide a "replace" option.
        // Let's implement "Replace All": Clear current items, import new ones.

        // Transaction to ensure atomicity
        return await prisma.$transaction(async (tx) => {
            // 1. Clear existing items
            // We need to delete in reverse hierarchy order or just cascade delete from roots.
            // Since we have cascade delete on database, we can just delete all items for this contract?
            // But we need to be careful. Let's delete all items where contractId matches.
            await tx.contractItem.deleteMany({ where: { contractId } });

            const workbook = new ExcelJS.Workbook();
            await workbook.xlsx.load(buffer as any);
            const worksheet = workbook.getWorksheet(1);

            if (!worksheet) throw new Error('Planilha não encontrada no arquivo');

            const rows: any[] = [];
            let rowIndex = 0;
            worksheet.eachRow((row, rowNumber) => {
                if (rowNumber === 1) return; // Skip header
                rowIndex++;

                const type = row.getCell(1).text?.trim() || ''; // A
                const code = row.getCell(2).text?.trim() || ''; // B
                const description = row.getCell(3).text?.trim() || ''; // C

                // Skip completely empty rows
                if (!type && !code && !description) return;

                rows.push({
                    rowIndex,
                    type,
                    code: code, // Keep empty if no code provided
                    description,
                    unit: row.getCell(4).text?.trim(), // D
                    quantity: row.getCell(5).value ? Number(row.getCell(5).value) : null, // E
                    unitPrice: row.getCell(6).value ? Number(row.getCell(6).value) : null, // F
                    costCenter: row.getCell(8).text?.trim(), // H
                    techSpecs: row.getCell(9).text?.trim(), // I
                });
            });

            // DO NOT SORT - process in original order for context-based parenting

            const codeIdMap = new Map<string, string>();

            // Type hierarchy levels (lower = higher in hierarchy)
            const typeLevel: Record<string, number> = {
                'STAGE': 1,
                'SUBSTAGE': 2,
                'LEVEL': 3,
                'SUBLEVEL': 4,
                'GROUP': 5,
                'SUBGROUP': 6,
                'ITEM': 7,
            };

            // Map Portuguese names to English enum values
            const typeMapping: Record<string, string> = {
                'ETAPA': 'STAGE',
                'SUB-ETAPA': 'SUBSTAGE',
                'SUBETAPA': 'SUBSTAGE',
                'NÍVEL': 'LEVEL',
                'NIVEL': 'LEVEL',
                'SUB-NÍVEL': 'SUBLEVEL',
                'SUB-NIVEL': 'SUBLEVEL',
                'SUBNIVEL': 'SUBLEVEL',
                'GRUPO': 'GROUP',
                'SUB-GRUPO': 'SUBGROUP',
                'SUBGRUPO': 'SUBGROUP',
                'ITEM': 'ITEM',
                'SERVIÇO': 'ITEM',
                'SERVICO': 'ITEM',
                'STAGE': 'STAGE',
                'SUBSTAGE': 'SUBSTAGE',
                'LEVEL': 'LEVEL',
                'SUBLEVEL': 'SUBLEVEL',
                'GROUP': 'GROUP',
                'SUBGROUP': 'SUBGROUP',
            };

            const validTypes = ['STAGE', 'SUBSTAGE', 'LEVEL', 'SUBLEVEL', 'GROUP', 'SUBGROUP', 'ITEM'];

            // Parent stack for context-based hierarchy
            // Each entry: { level, id, code }
            const parentStack: { level: number; id: string; code: string }[] = [];
            let orderIndex = 0;

            for (const row of rows) {
                // Map and validate type
                const rawType = (row.type || 'ITEM').toUpperCase().trim();
                let type = typeMapping[rawType] || rawType;
                if (!validTypes.includes(type)) {
                    type = 'ITEM';
                }

                const currentLevel = typeLevel[type];

                // Pop stack until we find a parent with lower level (higher in hierarchy)
                while (parentStack.length > 0 && parentStack[parentStack.length - 1].level >= currentLevel) {
                    parentStack.pop();
                }

                // Try code-based parent for dot notation (A. -> A.1)
                let parentId: string | null = null;
                const code = row.code;

                if (code.includes('.') && !code.startsWith('ROW_')) {
                    // Try code-based parent (A.1 -> A or A.)
                    const cleanCode = code.replace(/\.$/, '');
                    const parts = cleanCode.split('.');
                    if (parts.length > 1) {
                        const parentCode = parts.slice(0, -1).join('.');
                        parentId = codeIdMap.get(parentCode) || codeIdMap.get(parentCode + '.') || null;
                    }
                }

                // If no code-based parent, use stack-based parent
                if (!parentId && parentStack.length > 0) {
                    parentId = parentStack[parentStack.length - 1].id;
                }

                // Calc total
                let totalValue = 0;
                if (type === 'ITEM') {
                    totalValue = (row.quantity || 0) * (row.unitPrice || 0);
                }

                const created = await tx.contractItem.create({
                    data: {
                        contractId,
                        type: type as any,
                        code: row.code,
                        description: row.description,
                        parentId,
                        orderIndex: orderIndex++,
                        unit: row.unit,
                        quantity: row.quantity,
                        unitPrice: row.unitPrice,
                        totalValue,
                        costCenter: row.costCenter,
                        techSpecs: row.techSpecs
                    }
                });

                // Store in map for code-based lookups (only if code exists)
                if (row.code) {
                    codeIdMap.set(row.code, created.id);
                }

                // If this is a container type, push to stack
                if (type !== 'ITEM') {
                    parentStack.push({
                        level: currentLevel,
                        id: created.id,
                        code: row.code,
                    });
                }
            }

            // Recalculate Contract Total
            const aggregations = await tx.contractItem.aggregate({
                where: { contractId, type: 'ITEM' },
                _sum: { totalValue: true }
            });

            await tx.contract.update({
                where: { id: contractId },
                data: { totalValue: aggregations._sum.totalValue || 0 }
            });
        });
    }
}
