const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
  const keys = await prisma.providerAPIKey.findMany({ where: { provider: { providerSlug: 'groq' } }});
  console.log("Keys:", keys);
  
  const models = await prisma.aIModel.findMany({ where: { provider: { providerSlug: 'groq' } }});
  console.log("Groq Models:", models);
}
run();
