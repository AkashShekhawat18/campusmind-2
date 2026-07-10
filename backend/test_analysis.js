const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const analysis = await prisma.pYQAnalysisHistory.findFirst();
  console.log(analysis ? analysis.id : 'none');
}

check().finally(() => prisma.$disconnect());
