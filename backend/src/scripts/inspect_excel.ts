import ExcelJS from 'exceljs';

async function inspect() {
    const workbook = new ExcelJS.Workbook();
    const filePath = 'c:\\Users\\paulo.lima\\CRM-Engenharia\\.instruÃ§Ãµes-sistema\\03. BM 03 - 24.09 A 23.10 - rev02.xlsx';

    try {
        await workbook.xlsx.readFile(filePath);
        const sheet = workbook.getWorksheet('A.1');

        if (!sheet) {
            console.log('Sheet A.1 not found.');
            return;
        }

        console.log(`\nInspecting Sheet: ${sheet.name}`);

        // Iterate rows to find something that looks like a header
        for (let i = 1; i <= 20; i++) {
            const row = sheet.getRow(i);
            const values = row.values;
            // Filter out empty/null values to see clean data
            const cleanValues = (Array.isArray(values) ? values : []).slice(1).map(v => v?.toString() || '');

            if (cleanValues.some(v => v.length > 0)) {
                console.log(`Row ${i}:`, cleanValues);
            }
        }

    } catch (error) {
        console.error('Error reading file:', error);
    }
}

inspect();

