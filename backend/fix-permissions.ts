import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    // Atualizar permissões usando AMBOS os formatos para compatibilidade
    const fullPermissions = {
        // Formato de objeto (novo)
        contracts: { view: true, create: true, edit: true, delete: true },
        measurements: { view: true, create: true, edit: true, delete: true, approve: true },
        users: { view: true, create: true, edit: true, delete: true },
        companies: { view: true, create: true, edit: true, delete: true },
        roles: { view: true, create: true, edit: true, delete: true },
        reports: { view: true, export: true },
        settings: { view: true, edit: true },
        documents: { view: true, create: true, edit: true, delete: true, approve: true },
        audit: { view: true },

        // Formato string (legado - usado pelas rotas)
        contracts_view: true,
        contracts_create: true,
        measurements_view: true,
        measurements_create: true,
        users_view: true,
        users_manage: true,
        companies_manage: true,
        admin_roles: true,
        admin_audit: true,
        admin_settings: true,
        all: false // não dar acesso total, mas as permissões específicas acima
    };

    const adminRole = await prisma.role.update({
        where: { name: 'Admin' },
        data: { permissions: fullPermissions }
    });

    console.log('✅ Permissões do perfil Admin atualizadas com formatos compatíveis!');
    console.log('   Permissões atualizadas com sucesso.');
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
