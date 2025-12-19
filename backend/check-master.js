const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkMasterUser() {
    try {
        const user = await prisma.user.findUnique({
            where: { email: 'master@crm.com' }
        });

        if (!user) {
            console.log('❌ Usuário master@crm.com não encontrado no banco de dados');
        } else {
            console.log('✅ Usuário encontrado:');
            console.log('   Email:', user.email);
            console.log('   Nome:', user.fullName);
            console.log('   isMaster:', user.isMaster);
            console.log('   isActive:', user.isActive);
            console.log('   ID:', user.id);
        }
    } catch (error) {
        console.error('Erro ao verificar usuário:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkMasterUser();
