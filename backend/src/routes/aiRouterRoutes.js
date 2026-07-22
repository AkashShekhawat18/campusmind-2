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
    
    // 1. Get model config
    const modelConfig = await getModelConfig(model_id, message);

    // 2. Fetch context from Python RAG service
    let contextData = [];
    try {
      console.log(`[AI Router] Fetching RAG context for user_id="${user_id}", message="${(message || '').substring(0, 50)}"`);
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
      console.log(`[AI Router] RAG context length: ${typeof contextData === 'string' ? contextData.length : JSON.stringify(contextData).length}`);
    } catch (e) {
      console.error("Warning: Failed to fetch RAG context from Python:", e.message);
    }

    // 3. Assemble prompt
    let systemPrompt = `You are CampusGPT, a highly intelligent AI assistant for CampusMind.
Your goal is to help students and teachers learn, understand concepts, and debug code.
Be encouraging, clear, and concise. You can assist with any topic or question.

CRITICAL MATHEMATICAL & LATEX FORMATTING RULES:
1. YOU MUST OUTPUT ALL MATHEMATICAL FORMULAS, EQUATIONS, QUANTUM STATES (e.g. ket vectors |x⟩, |0⟩, |1⟩, bra vectors), VARIABLES WITH SUBSCRIPTS/SUPERSCRIPTS (e.g. U_f, (-1)^{f(x)}), OPERATORS (e.g. \\oplus, \\otimes, \\rightarrow), AND SYMBOLS IN VALID LATEX.
2. ALWAYS wrap inline math expressions with single dollar signs: $...$. Example: $|x\\rangle \\rightarrow (-1)^{f(x)}|x\\rangle$, $U_f |x\\rangle |1\\rangle = |x\\rangle |1 \\oplus f(x)\\rangle$.
3. ALWAYS wrap block/display equations with double dollar signs on separate lines: $$...$$
4. NEVER use plain text or Unicode math symbols like "|x⟩", "Uf", "⊕", "→", "^" outside of LaTeX dollar sign delimiters ($...$ or $$...$$).
5. Even if the uploaded document context contains plain text or unicode math symbols, YOU MUST convert them into proper LaTeX ($...$) in your final response so KaTeX can render them.`;

    if (typeof contextData === 'string' && contextData.trim() !== '') {
      systemPrompt += `\n\n--- UPLOADED DOCUMENT CONTEXT ---\n${contextData}\n-----------------------------------\nIMPORTANT: The user has attached/uploaded document(s). You MUST use the above DOCUMENT CONTEXT to explain, analyze, or answer the user's questions about the document(s). Convert any raw text math into valid LaTeX ($...$). Do NOT claim the document is missing.`;
    } else if (Array.isArray(contextData) && contextData.length > 0) {
      const contextStr = contextData.map((c, i) => `Document Chunk ${i+1}:\n${c}`).join("\n\n");
      systemPrompt += `\n\n--- UPLOADED DOCUMENT CONTEXT ---\n${contextStr}\n-----------------------------------\nIMPORTANT: The user has attached/uploaded document(s). You MUST use the above DOCUMENT CONTEXT to explain, analyze, or answer the user's questions about the document(s). Convert any raw text math into valid LaTeX ($...$). Do NOT claim the document is missing.`;
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
