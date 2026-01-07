import bcrypt from 'bcryptjs';
import prisma from '../../config/database';

async function main() {
    const ownerCompany = await prisma.company.upsert({
        where: { id: 'default-company' },
        update: {},
        create: { id: 'default-company', name: 'Empresa Proprietária', type: 'OWNER' },
    });

    const adminRole = await prisma.role.upsert({
        where: { name: 'Admin' },
        update: {},
        create: {
            name: 'Admin',
            description: 'Administrador do sistema',
            permissions: { contracts: { view: true, create: true, edit: true, delete: true } },
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

    console.log('✅ Seed completo! Email: master@crm.com | Senha: Master@2024');
    console.log('✅ Níveis de aprovação criados: Fiscalização, Gerência, Diretoria');
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
