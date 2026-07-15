const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  await prisma.$executeRawUnsafe('TRUNCATE TABLE "AIModel" CASCADE;');
  await prisma.$executeRawUnsafe('TRUNCATE TABLE "AIProviderKey" CASCADE;');
  console.log('Cleared existing AIModel and AIProviderKey data.');
}

main().catch(console.error).finally(() => prisma.$disconnect());
