import 'dotenv/config';
import { createPrismaClient } from '../src/lib/prisma.js';

const prisma = createPrismaClient();

async function main() {
  const emails = ['joe@afosi.org', 'briankerio47@gmail.com'];
  for (const email of emails) {
    const u = await prisma.user.update({
      where: { email },
      data: { role: 'SUPER_ADMIN' },
      select: { email: true, role: true, name: true },
    });
    console.log(`✅ ${u.name} (${u.email}) → ${u.role}`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
