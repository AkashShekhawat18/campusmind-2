const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fix() {
  try {
    console.log("Fixing API Keys...");
    await prisma.providerAPIKey.updateMany({
      where: { provider: { providerSlug: 'groq' } },
      data: { status: 'Active' }
    });
    console.log("API Keys reset to Active.");

    console.log("Fixing Models...");
    // 1. Delete the duplicate one with priority 5
    await prisma.aIModel.deleteMany({
      where: {
        modelName: 'openai/gpt-oss-20b',
        priority: 5
      }
    });
    
    // 2. Update the old llama 3.1 8b one to the new model
    await prisma.aIModel.updateMany({
      where: { modelName: 'llama-3.1-8b-instant' },
      data: {
        modelName: 'openai/gpt-oss-20b',
        displayName: 'GPT-OSS 20B (Fast)',
        description: 'Ultra fast small model with reasoning.',
        supportsReasoning: true
      }
    });
    console.log("Database models migrated successfully.");
  } catch(e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}
fix();
