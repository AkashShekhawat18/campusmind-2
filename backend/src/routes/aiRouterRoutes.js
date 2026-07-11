const express = require('express');
const router = express.Router();
const axios = require('axios');
const { streamResponse, getModelConfig } = require('../services/aiRouter.service');
const prisma = require('../utils/prisma');

// Custom stream endpoint
router.post('/stream', async (req, res) => {
  try {
    const { message, user_id, chat_id, history, model_id } = req.body;
    
    // 1. Get model config
    const modelConfig = await getModelConfig(model_id);

    // 2. Fetch context from Python RAG service
    let contextData = [];
    try {
      const pythonRes = await axios.post('http://127.0.0.1:8000/api/ai/context', 
        new URLSearchParams({
          message: message || '',
          user_id: user_id || ''
        }).toString(),
        {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        }
      );
      if (pythonRes.data && pythonRes.data.context) {
        contextData = pythonRes.data.context;
      }
    } catch (e) {
      console.error("Warning: Failed to fetch RAG context from Python:", e.message);
    }

    // 3. Assemble prompt
    let systemPrompt = `You are CampusGPT, a highly intelligent AI assistant for CampusMind.
Your goal is to help students and teachers learn, understand concepts, and debug code.
Be encouraging, clear, and concise. You can assist with any topic or question.
IMPORTANT: When outputting mathematical equations, formulas, or expressions, YOU MUST use standard LaTeX syntax. Use $ for inline math (e.g. $x^2$) and $$ for display math (e.g. $$x = \\frac{-b}{2a}$$). NEVER use Unicode math symbols or raw text for equations.`;

    if (typeof contextData === 'string' && contextData.trim() !== '') {
      systemPrompt += `\n\nRELEVANT CONTEXT:\n${contextData}\n\nUse this context to answer the user's question if applicable.`;
    } else if (Array.isArray(contextData) && contextData.length > 0) {
      const contextStr = contextData.map((c, i) => `Document ${i+1}:\n${c}`).join("\n\n");
      systemPrompt += `\n\nRELEVANT CONTEXT:\n${contextStr}\n\nUse this context to answer the user's question if applicable.`;
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

    // 4. Stream response and capture metrics
    const metrics = await streamResponse(req, res, modelConfig, messages);
    
    // We don't save to DB here because the frontend calls /api/student/chat/save separately!
    // But we COULD save metrics if we want. For now, frontend handles DB save.
    
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

module.exports = router;
