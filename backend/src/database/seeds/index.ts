import bcrypt from 'bcryptjs';
import prisma from '../../config/database';
import { seedDocumentCategories } from './document-categories';

async function main() {
    const adminPermissions = {
        contracts: { view: true, create: true, edit: true, delete: true },
        reports: { export: true },
        addendums: { view: true, create: true, approve: true },
        measurements: { view: true, create: true, edit: true, close: true },
        users: { view: true, manage: true },
        companies: { view: true, manage: true },
        tasks: { view: true, manage: true },
        admin_roles: true,
        admin_audit: true,
        admin_settings: true,
    };

    const ownerCompany = await prisma.company.upsert({
        where: { id: 'default-company' },
        update: {},
        create: { id: 'default-company', name: 'Empresa Proprietária', type: 'OWNER' },
    });

    const adminRole = await prisma.role.upsert({
        where: { name: 'Admin' },
        update: {
            description: 'Administrador do sistema',
            permissions: adminPermissions,
        },
        create: {
            name: 'Admin',
            description: 'Administrador do sistema',
            permissions: adminPermissions,
        },
    });

    const masterPassword = await bcrypt.hash('Master@2024', 12);
    await prisma.user.upsert({
        where: { email: 'master@crm.com' },
        update: {},
        create: {
            email: 'master@crm.com',
            password: masterPassword,
            fullName: 'Usuário Master',
            companyId: ownerCompany.id,
            roleId: adminRole.id,
            isMaster: true,
        },
    });

    // Criar níveis de aprovação padrão
    const approvalLevels = [
        { level: 1, name: 'Fiscalização', description: 'Aprovação da equipe de fiscalização em campo' },
        { level: 2, name: 'Gerência', description: 'Aprovação do gerente de contrato' },
        { level: 3, name: 'Diretoria', description: 'Aprovação final da diretoria' },
    ];

    for (const al of approvalLevels) {
        await prisma.approvalLevel.upsert({
            where: { level: al.level },
            update: {},
            create: al,
        });
    }

    await seedDocumentCategories();

    console.log('✅ Seed completo! Email: master@crm.com | Senha: Master@2024');
    console.log('✅ Níveis de aprovação criados: Fiscalização, Gerência, Diretoria');
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
