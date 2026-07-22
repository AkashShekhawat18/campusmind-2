const prisma = require('../utils/prisma');
const Groq = require('groq-sdk');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const Anthropic = require('@anthropic-ai/sdk');
const axios = require('axios');

// Fetch the best API key for a provider (Round Robin based on lastUsed)
const getProviderKey = async (providerId, previousFailedKeyId = null) => {
  const whereClause = { providerId, active: true, status: 'Active' };
  if (previousFailedKeyId) {
    whereClause.id = { not: previousFailedKeyId };
  }

  const keys = await prisma.providerAPIKey.findMany({
    where: whereClause,
    orderBy: { lastUsed: 'asc' }
  });
  
  if (keys.length > 0) {
    const selectedKey = keys[0];
    
    // Check limits
    if (selectedKey.requestsToday >= selectedKey.dailyLimit) {
      // Mark as RateLimited, find another
      await prisma.providerAPIKey.update({
        where: { id: selectedKey.id },
        data: { status: 'RateLimited' }
      }).catch(() => {});
      return getProviderKey(providerId, selectedKey.id); // Try next
    }

    await prisma.providerAPIKey.update({
      where: { id: selectedKey.id },
      data: { 
        lastUsed: new Date(),
        usageCount: { increment: 1 },
        requestsToday: { increment: 1 }
      }
    }).catch(() => {});
    return selectedKey; // Return the full key object
  }
  
  return null;
};

// Route and stream to the selected model with Fallback
const streamResponse = async (req, res, modelConfig, messages, attempt = 1, previousFailedKeyId = null) => {
  if (attempt > 3) {
    res.write(`data: ${JSON.stringify({ type: 'error', content: 'All providers failed after 3 attempts. Please try again later.' })}\n\n`);
    res.end();
    return { error: 'All retries failed' };
  }

  const providerName = modelConfig?.provider?.providerSlug || 'groq';
  const modelName = modelConfig?.modelName || 'llama-3.3-70b-versatile';
  const startTime = Date.now();
  let tokens = 0;
  
  if (attempt === 1) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
  }

  let keyObject = null;
  try {
    keyObject = await getProviderKey(modelConfig.providerId, previousFailedKeyId);
    let apiKey = keyObject ? keyObject.encryptedApiKey : null;

    if (!apiKey) {
      // Fallback to ENV if DB has no active keys
      apiKey = process.env[`${providerName.toUpperCase()}_API_KEY`];
      if (!apiKey && process.env[`${providerName.toUpperCase()}_API_KEYS`]) {
        apiKey = process.env[`${providerName.toUpperCase()}_API_KEYS`].split(',')[0].trim();
      }
      if (apiKey) apiKey = apiKey.replace(/^["']|["']$/g, '');
    }

    if (!apiKey && providerName !== 'ollama' && modelConfig?.provider?.providerType !== 'Local') {
      throw new Error(`No API key available for provider: ${providerName}`);
    }

    console.log(`[AI Router] Attempt ${attempt}: Using provider="${providerName}", Model="${modelName}"`);

    if (attempt === 1) res.write(`data: ${JSON.stringify({ type: 'start' })}\n\n`);

    if (providerName === 'groq') {
      const groq = new Groq({ apiKey });
      const stream = await groq.chat.completions.create({
        messages: messages,
        model: modelName,
        temperature: modelConfig.temperature || 0.7,
        max_tokens: modelConfig.maxTokens || 2048,
        stream: true
      });

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || "";
        if (content) {
          tokens += 1;
          res.write(`data: ${JSON.stringify({ type: 'token', content })}\n\n`);
        }
      }
    } 
    else if (providerName === 'google') {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: modelName || "gemini-1.5-flash" });
      
      const systemMessage = messages.find(m => m.role === 'system')?.content || '';
      let chatHistory = messages.filter(m => m.role !== 'system');
      const latestMessage = chatHistory.pop() || { content: 'Hello' };
      
      const formattedHistory = chatHistory.map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
      }));

      const promptText = systemMessage ? `System Instruction:\n${systemMessage}\n\nUser:\n${latestMessage.content}` : latestMessage.content;
      
      const chat = model.startChat({ history: formattedHistory });
      const result = await chat.sendMessageStream(promptText);

      for await (const chunk of result.stream) {
        const chunkText = chunk.text();
        tokens += chunkText.length / 4;
        res.write(`data: ${JSON.stringify({ type: 'token', content: chunkText })}\n\n`);
      }
    }
    else if (providerName === 'anthropic') {
      const anthropic = new Anthropic({ apiKey });
      
      const systemMessage = messages.find(m => m.role === 'system')?.content || '';
      const chatHistory = messages.filter(m => m.role !== 'system');

      const stream = await anthropic.messages.create({
        model: modelName,
        max_tokens: modelConfig.maxTokens || 4096,
        system: systemMessage,
        messages: chatHistory.map(m => ({
          role: m.role,
          content: m.content
        })),
        stream: true
      });

      for await (const chunk of stream) {
        if (chunk.type === 'content_block_delta' && chunk.delta?.text) {
          tokens += 1;
          res.write(`data: ${JSON.stringify({ type: 'token', content: chunk.delta.text })}\n\n`);
        }
      }
    }
    else if (providerName === 'ollama' || modelConfig?.provider?.providerType === 'Local') {
      let baseURL = modelConfig?.provider?.apiBaseUrl || 'http://localhost:11434/v1';
      if (!baseURL.endsWith('/chat/completions')) {
        baseURL = `${baseURL.replace(/\/$/, '')}/chat/completions`;
      }

      const response = await axios({
        method: 'post',
        url: baseURL,
        headers: { 'Content-Type': 'application/json' },
        data: {
          model: modelName,
          messages: messages,
          temperature: modelConfig.temperature || 0.7,
          max_tokens: modelConfig.maxTokens || 2048,
          stream: true
        },
        responseType: 'stream',
        timeout: 15000
      });

      response.data.on('data', (chunk) => {
        const lines = chunk.toString().split('\n').filter(line => line.trim() !== '');
        for (const line of lines) {
          const message = line.replace(/^data: /, '');
          if (message === '[DONE]') break;
          try {
            const parsed = JSON.parse(message);
            const content = parsed.choices[0]?.delta?.content;
            if (content) {
              tokens += 1;
              res.write(`data: ${JSON.stringify({ type: 'token', content })}\n\n`);
            }
          } catch (e) {}
        }
      });

      await new Promise((resolve, reject) => {
        response.data.on('end', resolve);
        response.data.on('error', reject);
      });
    }
    else {
      let baseURL = modelConfig.provider.apiBaseUrl || 'https://api.openai.com/v1';
      if (!baseURL.endsWith('/chat/completions')) {
        baseURL = `${baseURL}/chat/completions`;
      }

      const response = await axios({
        method: 'post',
        url: baseURL,
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://campusmind.ai',
        },
        data: {
          model: modelName,
          messages: messages,
          temperature: modelConfig.temperature || 0.7,
          max_tokens: modelConfig.maxTokens || 2048,
          stream: true
        },
        responseType: 'stream'
      });

      response.data.on('data', (chunk) => {
        const lines = chunk.toString().split('\n').filter(line => line.trim() !== '');
        for (const line of lines) {
          const message = line.replace(/^data: /, '');
          if (message === '[DONE]') break;
          try {
            const parsed = JSON.parse(message);
            const content = parsed.choices[0]?.delta?.content;
            if (content) {
              tokens += 1;
              res.write(`data: ${JSON.stringify({ type: 'token', content })}\n\n`);
            }
          } catch (e) {}
        }
      });

      await new Promise((resolve, reject) => {
        response.data.on('end', resolve);
        response.data.on('error', reject);
      });
    }

    const latency = Date.now() - startTime;
    res.write(`data: ${JSON.stringify({ type: 'done', metrics: { tokens: Math.floor(tokens), latency } })}\n\n`);
    res.end();
    
    return { tokens: Math.floor(tokens), latency };

  } catch (err) {
    console.error(`AI Router Stream Error (Attempt ${attempt}):`, err.message || err);
    
    // Mark key as RateLimited/Invalid if keyObject exists
    if (keyObject) {
      await prisma.providerAPIKey.update({
        where: { id: keyObject.id },
        data: { status: 'RateLimited' }
      }).catch(() => {});
    }

    // Automatically fall back to Groq CampusMind Turbo model if non-Groq fails
    let fallbackModelConfig = modelConfig;
    if (providerName !== 'groq') {
      console.log(`[AI Router Fallback] Provider ${providerName} failed. Switching to Groq...`);
      const groqModel = await prisma.aIModel.findFirst({
        where: { enabled: true, provider: { providerSlug: 'groq' } },
        include: { provider: true }
      });
      if (groqModel) {
        fallbackModelConfig = groqModel;
      }
    }

    return streamResponse(req, res, fallbackModelConfig, messages, attempt + 1, keyObject?.id || null);
  }
};

const getModelConfig = async (modelId, prompt = "") => {
  if (!modelId || modelId === 'auto') {
    // Intelligent Routing logic
    const lowerPrompt = prompt.toLowerCase();
    
    let requiredCapability = null;
    if (lowerPrompt.includes('code') || lowerPrompt.includes('debug') || lowerPrompt.includes('function') || lowerPrompt.includes('python') || lowerPrompt.includes('javascript') || lowerPrompt.includes('react')) {
      requiredCapability = 'coding';
    }
    
    if (lowerPrompt.includes('math') || lowerPrompt.includes('equation') || lowerPrompt.includes('calculate') || lowerPrompt.includes('derive')) {
      requiredCapability = 'reasoning';
    }

    let model;
    if (requiredCapability === 'reasoning') {
      model = await prisma.aIModel.findFirst({
        where: { supportsReasoning: true, enabled: true },
        orderBy: { priority: 'desc' },
        include: { provider: true }
      });
    }

    if (!model) {
      model = await prisma.aIModel.findFirst({
        where: { enabled: true },
        orderBy: { priority: 'desc' },
        include: { provider: true }
      });
    }
    
    return model;
  }

  const model = await prisma.aIModel.findUnique({ 
    where: { id: modelId },
    include: { provider: true } 
  });

  if (!model || !model.enabled) {
    return await prisma.aIModel.findFirst({
      where: { enabled: true },
      orderBy: { priority: 'desc' },
      include: { provider: true }
    });
  }
  
  return model;
};

module.exports = {
  streamResponse,
  getModelConfig,
  getProviderKey
};
