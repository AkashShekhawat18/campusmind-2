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
        modelName: 'openai/gpt-oss-20b',
        displayName: 'GPT-OSS 20B',
        description: 'Fast, highly capable GPT-OSS 20B model for accurate text and reasoning tasks.',
      }
    });
    console.log('Successfully updated decommissioned gemma model to openai/gpt-oss-20b.');
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
