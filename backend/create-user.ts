import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = 'paulo.lima@consorcio381.com.br';
  const password = 'psstz72659913Ps*';
  const fullName = 'Paulo Lima';

  // Hash da senha
  const hashedPassword = await bcrypt.hash(password, 12);

  // Buscar empresa e role padrão
  const company = await prisma.company.findFirst({ where: { type: 'OWNER' } });
  const role = await prisma.role.findFirst({ where: { name: 'Admin' } });

  if (!company || !role) {
    console.error('Empresa ou role não encontrados. Execute o seed primeiro.');
    process.exit(1);
  }

  // Criar ou atualizar usuário
  const user = await prisma.user.upsert({
    where: { email },
    update: { 
      password: hashedPassword,
      fullName,
      isActive: true
    },
    create: {
      email,
      password: hashedPassword,
      fullName,
      companyId: company.id,
      roleId: role.id,
      isActive: true,
      isMaster: false
    }
  });

  console.log('✅ Usuário criado/atualizado com sucesso!');
  console.log('   Email:', user.email);
  console.log('   Nome:', user.fullName);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
