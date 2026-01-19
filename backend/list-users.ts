import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const users = await prisma.user.findMany({
        select: {
            email: true,
            fullName: true,
            isActive: true
        }
    });
    console.log('Total de usuários:', users.length);
    users.forEach((u, i) => {
        console.log(`${i + 1}. ${u.fullName} - ${u.email} - Ativo: ${u.isActive}`);
    });
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
