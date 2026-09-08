import { prisma } from '@/lib/prisma';
import { seedDatabase } from '@/lib/seed';

async function main() {
  console.log('Seeding the production template database...');

  await seedDatabase();

  console.log('Production template seed completed successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });