const prisma = require('../utils/prisma');
const Groq = require('groq-sdk');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const Anthropic = require('@anthropic-ai/sdk');
const axios = require('axios');

// Fetch the best API key for a provider (Round Robin based on lastUsed)
const getProviderKey = async (provider) => {
  const keys = await prisma.aIProviderKey.findMany({
    where: { provider: { equals: provider, mode: 'insensitive' }, isActive: true },
    orderBy: { lastUsed: 'asc' }
  });
  
  if (keys.length > 0) {
    const selectedKey = keys[0];
    await prisma.aIProviderKey.update({
      where: { id: selectedKey.id },
      data: { lastUsed: new Date() }
    });
    return selectedKey.apiKey;
  }
  
  // Fallback to env vars if no DB keys
  return process.env[`${provider.toUpperCase()}_API_KEY`];
};

// Route and stream to the selected model
const streamResponse = async (req, res, modelConfig, messages) => {
  let { provider, modelName } = modelConfig;
  const startTime = Date.now();
  let tokens = 0;
  
  // Set headers for SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  
  try {
    const apiKey = await getProviderKey(provider);
    if (!apiKey) {
      throw new Error(`No API key available for provider: ${provider}`);
    }

    res.write(`data: ${JSON.stringify({ type: 'start' })}\n\n`);

    if (provider.toLowerCase() === 'groq') {
      const groq = new Groq({ apiKey });
      const stream = await groq.chat.completions.create({
        messages: messages,
        model: modelName,
        temperature: 0.7,
        max_tokens: 2048,
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
    else if (provider.toLowerCase() === 'google' || provider.toLowerCase() === 'gemini') {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: modelName || "gemini-1.5-flash" });
      
      const systemMessage = messages.find(m => m.role === 'system')?.content || '';
      let chatHistory = messages.filter(m => m.role !== 'system');
      const latestMessage = chatHistory.pop();
      
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
    else if (provider.toLowerCase() === 'anthropic') {
      const anthropic = new Anthropic({ apiKey });
      
      const systemMessage = messages.find(m => m.role === 'system')?.content || '';
      const chatHistory = messages.filter(m => m.role !== 'system');

      const stream = await anthropic.messages.create({
        model: modelName,
        max_tokens: 4096,
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
    else {
      let baseURL = 'https://api.openai.com/v1/chat/completions';
      if (provider.toLowerCase() === 'openrouter') baseURL = 'https://openrouter.ai/api/v1/chat/completions';
      if (provider.toLowerCase() === 'deepseek') baseURL = 'https://api.deepseek.com/chat/completions';
      if (provider.toLowerCase() === 'together') baseURL = 'https://api.together.xyz/v1/chat/completions';

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
          temperature: 0.7,
          max_tokens: 2048,
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
    console.error("AI Router Stream Error:", err.message || err);
    res.write(`data: ${JSON.stringify({ type: 'error', content: 'An error occurred while generating the response.' })}\n\n`);
    res.end();
    return { error: err.message };
  }
};

const getModelConfig = async (modelId) => {
  if (!modelId || modelId === 'auto') {
    const model = await prisma.aIModel.findFirst({
      where: { modelName: 'llama-3.3-70b-versatile', enabled: true }
    });
    if (model) return model;
    return { provider: 'Groq', modelName: 'llama-3.3-70b-versatile', displayName: 'CampusMind Turbo' };
  }

  const model = await prisma.aIModel.findUnique({ where: { id: modelId } });
  if (!model || !model.enabled) {
    return { provider: 'Groq', modelName: 'llama-3.3-70b-versatile', displayName: 'CampusMind Turbo' };
  }
  
  return model;
};

module.exports = {
  streamResponse,
  getModelConfig,
  getProviderKey
};
