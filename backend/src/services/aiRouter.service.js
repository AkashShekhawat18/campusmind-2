const prisma = require('../utils/prisma');
const Groq = require('groq-sdk');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const Anthropic = require('@anthropic-ai/sdk');
const axios = require('axios');

// In-memory model config cache (TTL: 60 seconds) to avoid DB hit on every message
const modelConfigCache = new Map();
const MODEL_CACHE_TTL_MS = 60_000;

const getProviderKey = async (providerId, previousFailedKeyId = null) => {
  const whereClause = { providerId, active: true, status: 'Active' };
  if (previousFailedKeyId) {
    whereClause.id = { not: previousFailedKeyId };
  }

  const keys = await prisma.providerAPIKey.findMany({
    where: { ...whereClause, status: { notIn: ['RateLimited', 'Invalid'] } },
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
  const modelName = modelConfig?.modelName || 'openai/gpt-oss-20b';
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
      apiKey = process.env[`${providerName.toUpperCase()}_API_KEY` ];
      if (!apiKey && process.env[`${providerName.toUpperCase()}_API_KEYS`]) {
        apiKey = process.env[`${providerName.toUpperCase()}_API_KEYS`].split(',')[0].trim();
      }
      if (!apiKey && (providerName === 'google' || providerName === 'gemini')) {
        apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || (process.env.GEMINI_API_KEYS ? process.env.GEMINI_API_KEYS.split(',')[0].trim() : null) || (process.env.GOOGLE_API_KEYS ? process.env.GOOGLE_API_KEYS.split(',')[0].trim() : null);
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
      
      // Candidate model hierarchy to guarantee 100% uptime for Google models
      let candidates = ['gemini-2.5-flash', 'gemma-4-26b-a4b-it'];
      if (modelName && modelName !== 'gemini-1.5-flash' && modelName !== 'gemini-1.5-pro') {
        candidates.unshift(modelName);
      } else if (modelName) {
        candidates.push(modelName);
      }

      let lastError = null;
      let streamedSuccess = false;

      for (const candidateModelName of candidates) {
        try {
          console.log(`[AI Router] Trying Google model: ${candidateModelName}`);
          const model = genAI.getGenerativeModel({ model: candidateModelName });
          
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
          streamedSuccess = true;
          break;
        } catch (gErr) {
          console.warn(`[AI Router] Google Model '${candidateModelName}' failed: ${gErr.message}`);
          lastError = gErr;
        }
      }

      if (!streamedSuccess && lastError) {
        throw lastError;
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
      let baseURL = process.env.OLLAMA_BASE_URL || modelConfig?.provider?.apiBaseUrl || 'http://localhost:11434';
      // Use Ollama's native /api/chat endpoint (supports think:false and options)
      baseURL = `${baseURL.replace(/\/$/, '').replace(/\/v1\/chat\/completions$/, '').replace(/\/api\/chat$/, '')}/api/chat`;

      const response = await axios({
        method: 'post',
        url: baseURL,
        headers: { 'Content-Type': 'application/json' },
        data: {
          model: modelName,
          messages: messages,
          stream: true,
          think: false,  // Disable Qwen3 chain-of-thought reasoning (~3-4x faster)
          options: {
            temperature: 0.5,
            num_ctx: 2048,       // Smaller context window = faster prompt processing
            num_predict: 512,    // Limit generation length
            num_thread: 12,      // Use all CPU cores
            repeat_penalty: 1.1,
            top_k: 20,           // Smaller top_k = faster sampling
            top_p: 0.8
          }
        },
        responseType: 'stream',
        timeout: 120000
      });

      // Ollama native /api/chat streams NDJSON (one JSON object per line)
      let buffer = '';
      response.data.on('data', (chunk) => {
        buffer += chunk.toString();
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;
          try {
            const parsed = JSON.parse(trimmed);
            // Native format: { message: { content: "..." }, done: false }
            const content = parsed.message?.content || '';
            if (content && !parsed.done) {
              // Strip any residual think tags
              const clean = content.replace(/<\/?think>/g, '');
              if (clean) {
                tokens += 1;
                res.write(`data: ${JSON.stringify({ type: 'token', content: clean })}\n\n`);
              }
            }
          } catch (e) {}
        }
      });

      await new Promise((resolve, reject) => {
        response.data.on('end', () => {
          if (buffer.trim()) {
            try {
              const parsed = JSON.parse(buffer.trim());
              const content = parsed.message?.content || '';
              if (content && !parsed.done) {
                const clean = content.replace(/<\/?think>/g, '');
                if (clean) {
                  tokens += 1;
                  res.write(`data: ${JSON.stringify({ type: 'token', content: clean })}\n\n`);
                }
              }
            } catch (e) {}
          }
          resolve();
        });
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
          'HTTP-Referer': 'https://malphor.ai',
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
    
    // Mark key correctly: 401 = Invalid key, 429 = actually rate limited
    if (keyObject) {
      const statusCode = err?.status || err?.response?.status || 0;
      const newStatus = statusCode === 401 ? 'Invalid' : 'RateLimited';
      await prisma.providerAPIKey.update({
        where: { id: keyObject.id },
        data: { status: newStatus }
      }).catch(() => {});
    }

    // Automatically fall back to Groq MALPHOR Turbo model if non-Groq fails
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
  const cacheKey = modelId || 'auto';
  const cached = modelConfigCache.get(cacheKey);
  if (cached && (Date.now() - cached.ts) < MODEL_CACHE_TTL_MS) {
    return cached.model;
  }

  let model = null;

  if (!modelId || modelId === 'auto') {
    // Default to highest-priority enabled Groq model (fastest LPU inference)
    model = await prisma.aIModel.findFirst({
      where: { enabled: true, provider: { providerSlug: 'groq' } },
      orderBy: { priority: 'desc' },
      include: { provider: true }
    });
    if (!model) {
      model = await prisma.aIModel.findFirst({
        where: { enabled: true },
        orderBy: { priority: 'desc' },
        include: { provider: true }
      });
    }
  } else {
    model = await prisma.aIModel.findUnique({ 
      where: { id: modelId },
      include: { provider: true } 
    });
    if (!model || !model.enabled) {
      model = await prisma.aIModel.findFirst({
        where: { enabled: true },
        orderBy: { priority: 'desc' },
        include: { provider: true }
      });
    }
  }

  if (model) modelConfigCache.set(cacheKey, { model, ts: Date.now() });
  return model;
};

module.exports = {
  streamResponse,
  getModelConfig,
  getProviderKey
};
