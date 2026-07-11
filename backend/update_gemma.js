const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const existingModel = await prisma.aIModel.findFirst({
    where: { modelName: 'gemma2-9b-it' }
  });

  if (existingModel) {
    await prisma.aIModel.update({
      where: { id: existingModel.id },
      data: {
        modelName: 'llama-3.1-8b-instant',
        displayName: 'Llama 3.1 8B (Free)',
        description: 'Fast, lightweight Llama model for quick responses and simple tasks.',
      }
    });
    console.log('Successfully updated decommissioned gemma model to llama-3.1-8b-instant.');
  } else {
    console.log('Model not found, maybe already updated.');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
