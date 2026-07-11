const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const models = [
    {
      provider: 'Groq',
      modelName: 'llama-3.3-70b-versatile',
      displayName: 'CampusMind Turbo',
      description: 'Lightning fast, highly capable model for general tasks and quick answers.',
      category: 'CampusMind Models',
      enabled: true,
      premium: false,
      vision: false,
      reasoning: true,
      coding: true,
      pdf: true,
      math: true,
      priority: 100
    },
    {
      provider: 'Groq',
      modelName: 'deepseek-r1-distill-llama-70b',
      displayName: 'CampusMind Reasoning (DeepSeek)',
      description: 'Advanced reasoning model for complex math, logic, and coding problems.',
      category: 'CampusMind Models',
      enabled: true,
      premium: true,
      vision: false,
      reasoning: true,
      coding: true,
      pdf: true,
      math: true,
      priority: 90
    },
    {
      provider: 'OpenAI',
      modelName: 'gpt-4o',
      displayName: 'GPT-4o',
      description: 'OpenAI\'s flagship model. Unmatched intelligence and vision capabilities.',
      category: 'Premium Models',
      enabled: true,
      premium: true,
      vision: true,
      reasoning: true,
      coding: true,
      pdf: true,
      math: true,
      priority: 80
    },
    {
      provider: 'Anthropic',
      modelName: 'claude-3-5-sonnet-20241022',
      displayName: 'Claude 3.5 Sonnet',
      description: 'Anthropic\'s most intelligent model, excelling at complex reasoning and coding.',
      category: 'Premium Models',
      enabled: true,
      premium: true,
      vision: true,
      reasoning: true,
      coding: true,
      pdf: true,
      math: true,
      priority: 70
    },
    {
      provider: 'Google',
      modelName: 'gemini-1.5-pro',
      displayName: 'Gemini 1.5 Pro',
      description: 'Google\'s best model with a massive context window for huge documents.',
      category: 'Premium Models',
      enabled: true,
      premium: true,
      vision: true,
      reasoning: true,
      coding: true,
      pdf: true,
      math: true,
      priority: 60
    },
    {
      provider: 'Groq',
      modelName: 'llama-3.2-90b-vision-preview',
      displayName: 'Llama 3.2 Vision (Free)',
      description: 'Free tier vision model for analyzing images and visual content.',
      category: 'External Models',
      enabled: true,
      premium: false,
      vision: true,
      reasoning: false,
      coding: false,
      pdf: false,
      math: false,
      priority: 50
    },
    {
      provider: 'Groq',
      modelName: 'llama-3.1-8b-instant',
      displayName: 'Llama 3.1 8B (Free)',
      description: 'Fast, lightweight Llama model for quick responses and simple tasks.',
      category: 'External Models',
      enabled: true,
      premium: false,
      vision: false,
      reasoning: false,
      coding: false,
      pdf: false,
      math: false,
      priority: 40
    }
  ];

  for (const model of models) {
    await prisma.aIModel.upsert({
      where: { id: model.modelName }, // This won't work perfectly since id is uuid. We can findFirst by modelName.
      update: {},
      create: model
    }).catch(async (e) => {
        // If upsert fails because id is UUID, just findFirst and create if not exists
        const existing = await prisma.aIModel.findFirst({ where: { modelName: model.modelName }});
        if (!existing) {
            await prisma.aIModel.create({ data: model });
        }
    });
  }

  console.log('Seeded AI models successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
