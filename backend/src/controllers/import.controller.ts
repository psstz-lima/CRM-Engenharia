import { Request, Response } from 'express';
import prisma from '../config/database';
import ExcelJS from 'exceljs';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Configuração do multer para upload
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.resolve(__dirname, '../../uploads/imports');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, `import-${uniqueSuffix}${path.extname(file.originalname)}`);
    }
});

export const uploadMiddleware = multer({
    storage,
    fileFilter: (req, file, cb) => {
        const allowedTypes = [
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-excel'
        ];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Apenas arquivos Excel são permitidos'));
        }
    },
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB
}).single('file');

interface ImportResult {
    success: boolean;
    totalRows: number;
    imported: number;
    errors: { row: number; message: string }[];
    warnings: { row: number; message: string }[];
}

export class ImportController {
    // Preview do arquivo antes de importar
    static async previewContractItems(req: Request, res: Response) {
        try {
            if (!req.file) {
                return res.status(400).json({ error: 'Nenhum arquivo enviado' });
            }

            const workbook = new ExcelJS.Workbook();
            await workbook.xlsx.readFile(req.file.path);

            const sheet = workbook.worksheets[0];
            if (!sheet) {
                return res.status(400).json({ error: 'Planilha vazia' });
            }

            const headers: string[] = [];
            const preview: any[] = [];

            sheet.eachRow((row, rowNumber) => {
                if (rowNumber === 1) {
                    // Header row
                    row.eachCell((cell, colNumber) => {
                        headers.push(String(cell.value || `Coluna ${colNumber}`));
                    });
                } else if (rowNumber <= 11) {
                    // Preview first 10 data rows
                    const rowData: Record<string, any> = {};
                    row.eachCell((cell, colNumber) => {
                        rowData[headers[colNumber - 1] || `col${colNumber}`] = cell.value;
                    });
                    preview.push({ row: rowNumber, data: rowData });
                }
            });

            // Sugestão de mapeamento automático
            const suggestedMapping: Record<string, string> = {};
            const mappableFields = ['code', 'description', 'unit', 'quantity', 'unitPrice', 'type'];

            headers.forEach(h => {
                const lower = h.toLowerCase();
                if (lower.includes('cod') || lower.includes('item')) suggestedMapping[h] = 'code';
                else if (lower.includes('desc') || lower.includes('serv')) suggestedMapping[h] = 'description';
                else if (lower.includes('un') && !lower.includes('unit')) suggestedMapping[h] = 'unit';
                else if (lower.includes('qtd') || lower.includes('quant')) suggestedMapping[h] = 'quantity';
                else if (lower.includes('preco') || lower.includes('preço') || lower.includes('unit')) suggestedMapping[h] = 'unitPrice';
                else if (lower.includes('tipo') || lower.includes('type')) suggestedMapping[h] = 'type';
            });

            res.json({
                filename: req.file.originalname,
                filePath: req.file.path,
                totalRows: sheet.rowCount - 1,
                headers,
                suggestedMapping,
                preview
            });
        } catch (e: any) {
            console.error('Erro no preview:', e);
            res.status(500).json({ error: e.message });
        }
    }

    // Importar itens de contrato
    static async importContractItems(req: Request, res: Response) {
        try {
            const { contractId, filePath, mapping, startRow = 2 } = req.body;

            if (!contractId || !filePath || !mapping) {
                return res.status(400).json({ error: 'Dados incompletos' });
            }

            // Verificar se contrato existe
            const contract = await prisma.contract.findUnique({ where: { id: contractId } });
            if (!contract) {
                return res.status(404).json({ error: 'Contrato não encontrado' });
            }

            const workbook = new ExcelJS.Workbook();
            await workbook.xlsx.readFile(filePath);
            const sheet = workbook.worksheets[0];

            if (!sheet) {
                return res.status(400).json({ error: 'Planilha vazia' });
            }

            const result: ImportResult = {
                success: true,
                totalRows: sheet.rowCount - 1,
                imported: 0,
                errors: [],
                warnings: []
            };

            // Pegar headers
            const headers: string[] = [];
            sheet.getRow(1).eachCell((cell, colNumber) => {
                headers.push(String(cell.value || ''));
            });

            // Encontrar índices das colunas mapeadas
            const colIndexes: Record<string, number> = {};
            Object.entries(mapping).forEach(([header, field]) => {
                const idx = headers.indexOf(header);
                if (idx !== -1) {
                    colIndexes[field as string] = idx + 1; // Excel é 1-indexed
                }
            });

            // Processar linhas
            const itemsToCreate: any[] = [];
            let orderIndex = 0;

            for (let rowNum = startRow; rowNum <= sheet.rowCount; rowNum++) {
                const row = sheet.getRow(rowNum);

                try {
                    const code = colIndexes.code ? String(row.getCell(colIndexes.code).value || '') : '';
                    const description = colIndexes.description ? String(row.getCell(colIndexes.description).value || '') : '';
                    const unit = colIndexes.unit ? String(row.getCell(colIndexes.unit).value || '') : '';
                    const quantity = colIndexes.quantity ? Number(row.getCell(colIndexes.quantity).value) || 0 : 0;
                    const unitPrice = colIndexes.unitPrice ? Number(row.getCell(colIndexes.unitPrice).value) || 0 : 0;
                    const typeRaw = colIndexes.type ? String(row.getCell(colIndexes.type).value || 'ITEM') : 'ITEM';

                    // Skip empty rows
                    if (!code && !description) {
                        continue;
                    }

                    // Mapear tipo
                    let type = 'ITEM';
                    const typeLower = typeRaw.toLowerCase();
                    if (typeLower.includes('etapa') || typeLower.includes('stage')) type = 'STAGE';
                    else if (typeLower.includes('sub') && typeLower.includes('etapa')) type = 'SUBSTAGE';
                    else if (typeLower.includes('grupo') || typeLower.includes('group')) type = 'GROUP';
                    else if (typeLower.includes('nivel') || typeLower.includes('level')) type = 'LEVEL';

                    const totalValue = quantity * unitPrice;

                    itemsToCreate.push({
                        contractId,
                        code: code.trim(),
                        description: description.trim(),
                        unit: unit.trim(),
                        quantity,
                        unitPrice,
                        totalValue,
                        type,
                        orderIndex: orderIndex++
                    });

                    // Warnings
                    if (!code) {
                        result.warnings.push({ row: rowNum, message: 'Código vazio' });
                    }
                    if (quantity <= 0 && type === 'ITEM') {
                        result.warnings.push({ row: rowNum, message: 'Quantidade zero ou negativa' });
                    }

                } catch (rowError: any) {
                    result.errors.push({ row: rowNum, message: rowError.message });
                }
            }

            // Inserir em batch
            if (itemsToCreate.length > 0) {
                await prisma.contractItem.createMany({
                    data: itemsToCreate,
                    skipDuplicates: true
                });
                result.imported = itemsToCreate.length;

                // Recalcular valor total do contrato
                const totalValue = itemsToCreate
                    .filter(i => i.type === 'ITEM')
                    .reduce((sum, i) => sum + i.totalValue, 0);

                await prisma.contract.update({
                    where: { id: contractId },
                    data: { totalValue: { increment: totalValue } }
                });
            }

            // Limpar arquivo temporário
            try {
                fs.unlinkSync(filePath);
            } catch { }

            result.success = result.errors.length === 0;
            res.json(result);

        } catch (e: any) {
            console.error('Erro na importação:', e);
            res.status(500).json({ error: e.message });
        }
    }

    // Baixar template de exemplo
    static async downloadTemplate(req: Request, res: Response) {
        try {
            const { type } = req.params;

            const workbook = new ExcelJS.Workbook();
            workbook.creator = 'CRM Engenharia';

            if (type === 'contract-items') {
                const sheet = workbook.addWorksheet('Itens do Contrato');

                // Headers
                sheet.columns = [
                    { header: 'Código', key: 'code', width: 15 },
                    { header: 'Descrição', key: 'description', width: 50 },
                    { header: 'Tipo', key: 'type', width: 12 },
                    { header: 'Unidade', key: 'unit', width: 10 },
                    { header: 'Quantidade', key: 'quantity', width: 15 },
                    { header: 'Preço Unitário', key: 'unitPrice', width: 15 }
                ];

                // Estilo do header
                sheet.getRow(1).font = { bold: true };
                sheet.getRow(1).fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: '3B82F6' }
                };
                sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' } };

                // Exemplo de dados
                sheet.addRow({ code: '1', description: 'ETAPA 1 - SERVIÇOS PRELIMINARES', type: 'STAGE', unit: '', quantity: '', unitPrice: '' });
                sheet.addRow({ code: '1.1', description: 'Mobilização de equipamentos', type: 'ITEM', unit: 'vb', quantity: 1, unitPrice: 15000 });
                sheet.addRow({ code: '1.2', description: 'Instalação de canteiro', type: 'ITEM', unit: 'm²', quantity: 500, unitPrice: 120 });
                sheet.addRow({ code: '2', description: 'ETAPA 2 - TERRAPLENAGEM', type: 'STAGE', unit: '', quantity: '', unitPrice: '' });
                sheet.addRow({ code: '2.1', description: 'Escavação mecânica', type: 'ITEM', unit: 'm³', quantity: 10000, unitPrice: 8.50 });

                // Instruções
                const instrSheet = workbook.addWorksheet('Instruções');
                instrSheet.getColumn(1).width = 80;
                instrSheet.addRow(['INSTRUÇÕES DE PREENCHIMENTO']);
                instrSheet.addRow(['']);
                instrSheet.addRow(['- Código: Identificador único do item (ex: 1, 1.1, 1.1.1)']);
                instrSheet.addRow(['- Descrição: Nome/descrição do serviço']);
                instrSheet.addRow(['- Tipo: STAGE (etapa), SUBSTAGE, GROUP, LEVEL, ITEM (serviço)']);
                instrSheet.addRow(['- Unidade: m, m², m³, kg, un, vb, etc.']);
                instrSheet.addRow(['- Quantidade: Quantidade contratada']);
                instrSheet.addRow(['- Preço Unitário: Valor em R$ por unidade']);
                instrSheet.getRow(1).font = { bold: true, size: 14 };
            }

            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename=template_${type}.xlsx`);

            await workbook.xlsx.write(res);
            res.end();
        } catch (e: any) {
            res.status(500).json({ error: e.message });
        }
    }
}
