import prisma from '../config/database';

async function main() {
    try {
        await prisma.user.update({
            where: { email: 'master@crm.com' },
            data: {
                lockedUntil: null,
                loginAttempts: 0
            }
        });
        console.log('✅ Account unlocked for master@crm.com');
    } catch (error) {
        console.error('Error unlocking account:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
