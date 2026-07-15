const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding AI Marketplace Providers and Models...');

  // 1. Providers
  const providersData = [
    { providerName: 'Groq', providerSlug: 'groq', providerType: 'Cloud', apiBaseUrl: 'https://api.groq.com/openai/v1', documentationUrl: 'https://console.groq.com/docs' },
    { providerName: 'Google', providerSlug: 'google', providerType: 'Cloud', apiBaseUrl: 'https://generativelanguage.googleapis.com', documentationUrl: 'https://ai.google.dev/docs' },
    { providerName: 'OpenAI', providerSlug: 'openai', providerType: 'Cloud', apiBaseUrl: 'https://api.openai.com/v1', documentationUrl: 'https://platform.openai.com/docs' },
    { providerName: 'Anthropic', providerSlug: 'anthropic', providerType: 'Cloud', apiBaseUrl: 'https://api.anthropic.com/v1', documentationUrl: 'https://docs.anthropic.com' },
    { providerName: 'DeepSeek', providerSlug: 'deepseek', providerType: 'Cloud', apiBaseUrl: 'https://api.deepseek.com', documentationUrl: 'https://platform.deepseek.com' },
    { providerName: 'OpenRouter', providerSlug: 'openrouter', providerType: 'Cloud', apiBaseUrl: 'https://openrouter.ai/api/v1', documentationUrl: 'https://openrouter.ai/docs' }
  ];

  const providerMap = {};

  for (const p of providersData) {
    const provider = await prisma.aIProvider.upsert({
      where: { providerSlug: p.providerSlug },
      update: p,
      create: p
    });
    providerMap[p.providerSlug] = provider.id;
  }

  // 2. Models
  const modelsData = [
    // Groq Models
    {
      providerId: providerMap['groq'],
      modelName: 'llama-3.3-70b-versatile',
      displayName: 'Llama 3.3 70B (Versatile)',
      description: 'Extremely fast logic and general chatting.',
      supportsChat: true, supportsVision: false, supportsReasoning: true, priority: 10,
    },
    {
      providerId: providerMap['groq'],
      modelName: 'llama-3.1-8b-instant',
      displayName: 'Llama 3.1 8B (Fast)',
      description: 'Ultra fast small model.',
      supportsChat: true, supportsVision: false, priority: 5,
    },
    // Google Models
    {
      providerId: providerMap['google'],
      modelName: 'gemini-1.5-pro',
      displayName: 'Gemini 1.5 Pro',
      description: 'Advanced reasoning, math, and multimodal capabilities.',
      supportsChat: true, supportsVision: true, supportsPdf: true, supportsLongContext: true, premium: true, priority: 15,
    },
    {
      providerId: providerMap['google'],
      modelName: 'gemini-1.5-flash',
      displayName: 'Gemini 1.5 Flash',
      description: 'Fast, lightweight multimodal model.',
      supportsChat: true, supportsVision: true, supportsPdf: true, priority: 10,
    },
    // OpenAI Models
    {
      providerId: providerMap['openai'],
      modelName: 'gpt-4o',
      displayName: 'GPT-4 Omni',
      description: 'State of the art multimodal model.',
      supportsChat: true, supportsVision: true, supportsReasoning: true, premium: true, priority: 20,
    },
    // Anthropic Models
    {
      providerId: providerMap['anthropic'],
      modelName: 'claude-3-5-sonnet-20240620',
      displayName: 'Claude 3.5 Sonnet',
      description: 'Excellent for coding, logic, and long context tasks.',
      supportsChat: true, supportsVision: true, supportsPdf: true, supportsLongContext: true, premium: true, priority: 18,
    },
    // DeepSeek Models
    {
      providerId: providerMap['deepseek'],
      modelName: 'deepseek-chat',
      displayName: 'DeepSeek Chat (V3)',
      description: 'Excellent open-weight reasoning model.',
      supportsChat: true, supportsReasoning: true, supportsFunctionCalling: true, priority: 12,
    },
    {
      providerId: providerMap['deepseek'],
      modelName: 'deepseek-reasoner',
      displayName: 'DeepSeek Reasoner (R1)',
      description: 'Advanced logical reasoning and math model.',
      supportsChat: true, supportsReasoning: true, premium: true, priority: 15,
    }
  ];

  for (const m of modelsData) {
    const existing = await prisma.aIModel.findFirst({
      where: { providerId: m.providerId, modelName: m.modelName }
    });
    if (!existing) {
      await prisma.aIModel.create({ data: m });
    }
  }

  // 3. API Keys Placeholder (Admins will add actual keys in dashboard, but we can seed from ENV for seamless migration)
  const envKeys = [
    { slug: 'groq', key: process.env.GROQ_API_KEYS?.split(',')[0]?.trim() || process.env.GROQ_API_KEY },
    { slug: 'google', key: process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY },
    { slug: 'openai', key: process.env.OPENAI_API_KEY },
    { slug: 'anthropic', key: process.env.ANTHROPIC_API_KEY },
    { slug: 'deepseek', key: process.env.DEEPSEEK_API_KEY }
  ];

  for (const e of envKeys) {
    if (e.key) {
      const existingKey = await prisma.providerAPIKey.findFirst({
        where: { providerId: providerMap[e.slug] }
      });
      if (!existingKey) {
        await prisma.providerAPIKey.create({
          data: {
            providerId: providerMap[e.slug],
            keyName: `${e.slug}-env-key`,
            encryptedApiKey: e.key.replace(/^["']|["']$/g, ''), // In a real app this would be encrypted
          }
        });
      }
    }
  }

  console.log('Marketplace Seeding Complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
