
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    const email = 'master@crm.com';
    const user = await prisma.user.findUnique({ where: { email } });

    if (user) {
        console.log('User master@crm.com exists.');
    } else {
        console.log('User master@crm.com DOES NOT exist. Recreating...');

        // Check for Owner Company
        let company = await prisma.company.findFirst({ where: { type: 'OWNER' } });
        if (!company) {
            console.log('Creating Owner Company...');
            company = await prisma.company.create({
                data: {
                    name: 'CRM Engenharia (Owner)',
                    type: 'OWNER',
                    cnpj: '00.000.000/0001-00'
                }
            });
        }

        // Check for Master Role
        let role = await prisma.role.findUnique({ where: { name: 'Master' } });
        if (!role) {
            console.log('Creating Master Role...');
            role = await prisma.role.create({
                data: {
                    name: 'Master',
                    description: 'Acesso total',
                    permissions: { all: true }
                }
            });
        }

        // Create User
        await prisma.user.create({
            data: {
                email,
                fullName: 'Usuario Master',
                password: await bcrypt.hash('master123', 10),
                companyId: company.id,
                roleId: role.id,
                isMaster: true
            }
        });
        console.log('Master user recreated successfully.');
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
