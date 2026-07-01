const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const r1 = await prisma.$queryRawUnsafe("EXPLAIN QUERY PLAN SELECT * FROM User WHERE status='ACTIVE' ORDER BY createdAt DESC;");
  console.log("USER EXPLAIN:");
  console.log(r1);
  
  const r2 = await prisma.$queryRawUnsafe("EXPLAIN QUERY PLAN SELECT * FROM Attendance WHERE courseAssignmentId='X' AND date='2026-06-30';");
  console.log("ATTENDANCE EXPLAIN:");
  console.log(r2);
  
  await prisma.$disconnect();
}
run();
