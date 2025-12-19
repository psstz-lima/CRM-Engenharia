const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function checkPassword() {
    try {
        const user = await prisma.user.findUnique({
            where: { email: 'master@crm.com' }
        });

        if (!user) {
            console.log('❌ Usuário não encontrado');
            return;
        }

        const passwordToTest = 'Master@2024';
        const isValid = await bcrypt.compare(passwordToTest, user.password);

        console.log('Email:', user.email);
        console.log('Senha testada:', passwordToTest);
        console.log('Senha válida?', isValid ? '✅ SIM' : '❌ NÃO');
        console.log('Hash armazenado:', user.password.substring(0, 20) + '...');

    } catch (error) {
        console.error('Erro:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkPassword();
