const { PrismaClient } = require('@prisma/client'); 
const prisma = new PrismaClient(); 

async function run() { 
  await prisma.user.deleteMany({ where: { email: 'teacher@campusmind.ai' } }); 
  console.log('Deleted Demo Teacher'); 
} 

run().catch(console.error).finally(() => prisma.$disconnect());
