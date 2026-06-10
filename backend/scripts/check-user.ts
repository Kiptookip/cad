import 'dotenv/config';
import { createPrismaClient } from '../src/lib/prisma.js';

const prisma = createPrismaClient();

async function main() {
  const u = await prisma.user.findUnique({
    where: { email: 'joe@afosi.org' },
    select: { email: true, name: true, role: true, isActive: true, agencyId: true },
  });
  console.log(u ?? 'NOT FOUND');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
