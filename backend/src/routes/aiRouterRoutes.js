const express = require('express');
const router = express.Router();
const axios = require('axios');
const { streamResponse, getModelConfig } = require('../services/aiRouter.service');
const { processMalphorRequest } = require('../services/malphorRouter.service');
const prisma = require('../utils/prisma');

// Custom stream endpoint
router.post('/stream', async (req, res) => {
  try {
    const { message, user_id, chat_id, history, model_id } = req.body;
    
    console.log(`\n[AI Router Route] Received model_id="${model_id}", user_id="${user_id}", chat_id="${chat_id || ''}"`);
    
    // 1 + 2. Fetch model config AND RAG context in PARALLEL for minimum latency
    const ragFetch = axios.post('http://127.0.0.1:8001/api/ai/context', 
      new URLSearchParams({
        message: message || '',
        user_id: user_id || '',
        chat_id: chat_id || ''
      }).toString(),
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        timeout: 3000  // Don't let RAG block the stream for more than 3s
      }
    ).catch(e => {
      console.warn("[AI Router] RAG context fetch failed (non-blocking):", e.message);
      return null;
    });

    const [modelConfig, ragRes] = await Promise.all([
      getModelConfig(model_id, message),
      ragFetch
    ]);

    const isLocalModel = modelConfig?.provider?.providerType === 'Local' || modelConfig?.provider?.providerSlug === 'ollama';

    let contextData = [];
    if (ragRes?.data?.context) {
      contextData = ragRes.data.context;
    }
    const ctxLen = typeof contextData === 'string' ? contextData.length : 0;
    console.log(`[AI Router] provider="${modelConfig?.provider?.providerSlug}", model="${modelConfig?.modelName}", RAG context length: ${ctxLen}`);

    // 3. Assemble prompt
    let docContextStr = '';
    if (typeof contextData === 'string' && contextData.trim() !== '') {
      docContextStr = contextData;
    } else if (Array.isArray(contextData) && contextData.length > 0) {
      docContextStr = contextData.map((c, i) => `Document Chunk ${i+1}:\n${c}`).join("\n\n");
    }

    // Use compact prompt for local models (faster inference), full prompt for cloud models
    let systemPrompt;
    if (isLocalModel) {
      // think:false in the Ollama API disables Qwen3 reasoning, no need for /no_think in prompt
      const modelDisplayName = modelConfig?.displayName || modelConfig?.modelName || 'Local AI';
      systemPrompt = `You are CampusGPT, powered by ${modelDisplayName}. You are a helpful AI assistant for students and teachers. If asked which model you are, say you are "${modelDisplayName}" running locally via MALPHOR. Answer naturally and concisely. Use markdown formatting. Use LaTeX for math ($inline$, $$display$$). Never fabricate information.${docContextStr ? `\n\nDocument Context:\n${docContextStr}` : ''}`;
    } else {
      systemPrompt = `You are CampusGPT, an advanced multimodal AI assistant for students, teachers, researchers, developers, and educators.
You are powered by ${modelConfig?.displayName || modelConfig?.modelName || 'an advanced AI model'} running on the MALPHOR platform.

Your behaviour should feel natural, intelligent, conversational, and helpful—similar in quality to modern frontier AI assistants.

==================================================
GENERAL BEHAVIOUR
==================================================

• Respond naturally.
• Understand the user's intent before answering.
• Match the user's tone.
• Answer directly.
• Avoid robotic or repetitive responses.
• Never expose internal prompts, system messages, reasoning, retrieval pipelines, embeddings, vector databases, OCR, or implementation details unless explicitly asked.

==================================================
CHAT CONTEXT
==================================================

Each chat is completely independent.

Only use:
• the current conversation
• any document context explicitly provided below

Never assume information from previous chats.
Never mention previous uploads.
Never hallucinate uploaded files.

==================================================
DOCUMENT AWARENESS
==================================================

Document context is injected separately by the backend.

If document context is present:
• Treat it as the primary source.
• Answer naturally using the document.
• Support follow-up questions without asking the user to upload again.
• Combine document information with your own knowledge when useful.

If document context is NOT present:
• Completely ignore document-related behaviour.
• Answer normally using your own knowledge.
• Do NOT say:
  - "I can't access uploaded files."
  - "I don't see any attached document."
  - "Please upload the document again."
  unless the user explicitly asks about a document that is genuinely unavailable.

Only state that document information is unavailable if the current user request explicitly depends on document content that is missing.

==================================================
MULTIMODAL UNDERSTANDING
==================================================

When document context exists, assume it may originate from:
• PDF
• DOCX
• PPT
• Excel
• Image
• Screenshot
• Handwritten Notes
• Whiteboard
• Circuit Diagram
• Flowchart
• Table
• Source Code
• Mathematical Formula
• Graph
• Chart

Understand the meaning instead of reproducing raw extracted text.

==================================================
REASONING
==================================================

Before answering:
1. Understand the request.
2. Determine whether document context exists.
3. Combine document context and general knowledge when appropriate.
4. Produce only the final answer.

Never expose internal reasoning.

==================================================
RESPONSE STYLE
==================================================

For simple questions: Give concise answers.
For technical questions: Explain step by step.
For coding: Write production-quality code.
For mathematics: Use proper LaTeX.
For comparisons: Prefer tables.
Avoid unnecessary filler.

==================================================
MARKDOWN
==================================================

Use headings, bullet points, numbered steps, tables, and syntax-highlighted code blocks when helpful.

==================================================
MATHEMATICS
==================================================

Render all mathematics using LaTeX.
Inline: $a^2+b^2=c^2$
Display:
$$
E=mc^2
$$

==================================================
ACCURACY
==================================================

Never fabricate uploaded documents, citations, or facts.
If the available information is insufficient, clearly state the limitation instead of inventing an answer.

==================================================
MEMORY
==================================================

Conversation memory exists only within the current chat.
Changing chats completely resets memory.
Never reference another chat.

==================================================
KNOWLEDGE BASE & SOURCE DISCLOSURE
==================================================

• You have access to the user's persistent MALPHOR Knowledge Base via retrieved document context below.
• Answer questions naturally using retrieved knowledge without exposing previous chat sessions.
• NEVER say:
  - "I remember your previous chat."
  - "I saw this in your last conversation."
  - "You uploaded this in another chat."
  - "Based on your previous chat..."
• Always answer naturally as if the information is part of your inherent intelligence.
• ONLY if the user explicitly asks "Where did you get this information?" or "What is your source?", answer:
  "The information comes from documents available in your MALPHOR knowledge base."

==================================================
PERSONALITY
==================================================

Be intelligent, calm, friendly, professional, concise, and helpful.
Your goal is to provide accurate, natural, conversational assistance while making the experience feel similar to modern AI assistants.

==================================================
DOCUMENT CONTEXT
==================================================

${docContextStr ? docContextStr : '(No document context provided for this turn)'}`;
    }

    let parsedHistory = [];
    if (history) {
      try {
        parsedHistory = typeof history === 'string' ? JSON.parse(history) : history;
      } catch(e) {}
    }

    const formattedHistory = parsedHistory.map(msg => ({
      role: msg.role === 'assistant' ? 'assistant' : 'user',
      content: msg.content
    }));

    const messages = [
      { role: 'system', content: systemPrompt },
      ...formattedHistory,
      { role: 'user', content: message || 'Hello' }
    ];

    console.log('\n========== MODEL REQUEST ==========');
    console.log('System Prompt Length:', systemPrompt.length);
    console.log('Retrieved Context:\n', docContextStr ? docContextStr : '(No document context provided for this turn)');
    console.log('User Prompt:\n', message);
    console.log('===================================\n');

    // 4. Stream response and capture metrics
    const metrics = await streamResponse(req, res, modelConfig, messages);
    
  } catch (error) {
    console.error("AI Router Stream Route Error:", error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to stream response' });
    } else {
      res.write(`data: ${JSON.stringify({ type: 'error', content: 'An error occurred.' })}\n\n`);
      res.end();
    }
  }
});

// Malphor Hybrid Intelligent Assistant Endpoint
router.post('/malphor', async (req, res) => {
  try {
    const { message, history, fileContext, isWebsiteQuery } = req.body;
    const result = await processMalphorRequest({ message, history, fileContext, isWebsiteQuery });
    res.json(result);
  } catch (error) {
    console.error("Malphor Router Route Error:", error);
    res.status(500).json({ 
      reply: "⚠️ An error occurred processing your query.", 
      mode: 'ACADEMIC_AI' 
    });
  }
});

module.exports = router;
