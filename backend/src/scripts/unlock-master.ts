
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        const user = await prisma.user.update({
            where: { email: 'master@crm.com' },
            data: {
                lockedUntil: null,
                loginAttempts: 0,
                isActive: true
            }
        });
        console.log(`User ${user.email} unlocked. LoginAttempts: ${user.loginAttempts}, LockedUntil: ${user.lockedUntil}`);
    } catch (error) {
        console.error('Error unlocking user:', error);
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
