
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const email = 'master@crm.com';
    const user = await prisma.user.findUnique({ where: { email }, include: { company: true } });

    console.log('User:', user);
    if (user) {
        console.log('isMaster:', user.isMaster);
        console.log('isActive:', user.isActive);
        console.log('Company:', user.company);
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
