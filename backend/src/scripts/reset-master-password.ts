import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    try {
        const hashedPassword = await bcrypt.hash('Master@2024', 12);
        const user = await prisma.user.update({
            where: { email: 'master@crm.com' },
            data: {
                password: hashedPassword,
                loginAttempts: 0,
                lockedUntil: null,
                isActive: true
            }
        });
        console.log(`User ${user.email} password reset to 'Master@2024'.`);
    } catch (error) {
        console.error('Error resetting password:', error);
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

