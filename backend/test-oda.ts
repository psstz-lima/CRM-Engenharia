
import * as fs from 'fs';
import * as path from 'path';

async function findOdaConverter() {
    const programFiles = process.env['ProgramFiles'] || 'C:\\Program Files';
    const odaBaseDir = path.join(programFiles, 'ODA');

    console.log('Procurando em:', odaBaseDir);

    try {
        if (fs.existsSync(odaBaseDir)) {
            const dirs = fs.readdirSync(odaBaseDir);
            console.log('Pastas encontradas:', dirs);

            for (const dir of dirs) {
                if (dir.startsWith('ODAFileConverter')) {
                    const exePath = path.join(odaBaseDir, dir, 'ODAFileConverter.exe');
                    if (fs.existsSync(exePath)) {
                        console.log('SUCESSO: ODA File Converter encontrado em:', exePath);
                        return;
                    } else {
                        console.log('Executável não encontrado em:', exePath);
                    }
                }
            }
        } else {
            console.log('Pasta ODA não existe.');
        }
    } catch (error) {
        console.error('Erro:', error);
    }
    console.log('FALHA: ODA não encontrado.');
}

findOdaConverter();
