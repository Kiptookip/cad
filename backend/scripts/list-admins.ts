import 'dotenv/config';
import { createPrismaClient } from '../src/lib/prisma.js';

const prisma = createPrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    where: { role: { in: ['SUPER_ADMIN', 'ADMIN'] } },
    select: { email: true, name: true, role: true, isActive: true },
    orderBy: { role: 'asc' },
  });

  if (users.length === 0) {
    console.log('⚠️  No ADMIN or SUPER_ADMIN users found.');
    return;
  }

  console.log(`\nFound ${users.length} admin user(s):\n`);
  users.forEach(u => {
    console.log(`  ${u.role.padEnd(12)} | ${u.email.padEnd(35)} | ${u.name} | active=${u.isActive}`);
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
