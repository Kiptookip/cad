import 'dotenv/config';
import { createPrismaClient } from '../src/lib/prisma.js';

const prisma = createPrismaClient();

async function main() {
  const updated = await prisma.user.updateMany({
    where: { email: 'Libanjoe7@gmail.com' },
    data: { email: 'libanjoe7@gmail.com' },
  });
  console.log(`Updated ${updated.count} record(s).`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
