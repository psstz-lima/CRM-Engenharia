import prisma from '../../config/database';

const documentCategories = [
    { code: 'ARQ', name: 'Arquitetura', color: '#3b82f6', icon: '📐', orderIndex: 1 },
    { code: 'EST', name: 'Estrutural', color: '#ef4444', icon: '🏗️', orderIndex: 2 },
    { code: 'ELE', name: 'Elétrica', color: '#eab308', icon: '⚡', orderIndex: 3 },
    { code: 'HID', name: 'Hidráulica', color: '#06b6d4', icon: '💧', orderIndex: 4 },
    { code: 'MEC', name: 'Mecânica', color: '#8b5cf6', icon: '🔧', orderIndex: 5 },
    { code: 'CLI', name: 'Climatização', color: '#22c55e', icon: '❄️', orderIndex: 6 },
    { code: 'INC', name: 'Incêndio', color: '#f97316', icon: '🔥', orderIndex: 7 },
    { code: 'PAI', name: 'Paisagismo', color: '#84cc16', icon: '🌳', orderIndex: 8 },
    { code: 'TER', name: 'Terraplenagem', color: '#a16207', icon: '🚧', orderIndex: 9 },
    { code: 'TOP', name: 'Topografia', color: '#7c3aed', icon: '📍', orderIndex: 10 },
    { code: 'GEO', name: 'Geotécnico', color: '#854d0e', icon: '🪨', orderIndex: 11 },
    { code: 'DOC', name: 'Documentação', color: '#6b7280', icon: '📋', orderIndex: 12 },
    { code: 'MEM', name: 'Memorial Descritivo', color: '#475569', icon: '📑', orderIndex: 13 },
    { code: 'ASB', name: 'As-Built', color: '#059669', icon: '✅', orderIndex: 14 }
];

export async function seedDocumentCategories() {
    console.log('🏷️ Criando categorias de documentos...');

    for (const category of documentCategories) {
        await prisma.documentCategory.upsert({
            where: { code: category.code },
            update: category,
            create: category
        });
    }

    console.log(`✅ ${documentCategories.length} categorias criadas/atualizadas`);
}

// Executar se chamado diretamente
if (require.main === module) {
    seedDocumentCategories()
        .then(() => prisma.$disconnect())
        .catch((e) => {
            console.error(e);
            prisma.$disconnect();
            process.exit(1);
        });
}
