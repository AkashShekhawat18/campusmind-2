const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const axios = require('axios');

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://127.0.0.1:8001';

exports.getChatHistory = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = await prisma.pyqChatSession.findUnique({
      where: { id: sessionId },
      include: {
        messages: {
          orderBy: { timestamp: 'asc' }
        }
      }
    });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    if (session.userId !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    res.status(200).json(session);
  } catch (error) {
    console.error('Get Chat History Error:', error);
    res.status(500).json({ error: 'Failed to fetch chat history' });
  }
};

exports.globalChat = async (req, res) => {
  try {
    const { message, sessionId } = req.body;
    const userId = req.user.id;

    let session;
    if (sessionId) {
      session = await prisma.pyqChatSession.findUnique({ where: { id: sessionId } });
      if (!session || session.userId !== userId) {
        return res.status(403).json({ error: 'Invalid session' });
      }
    } else {
      session = await prisma.pyqChatSession.create({
        data: {
          userId,
          type: 'GLOBAL'
        }
      });
    }

    const history = await prisma.pyqChatMessage.findMany({
      where: { sessionId: session.id },
      orderBy: { timestamp: 'asc' },
      take: 10
    });

    const formattedHistory = [];
    for (const msg of history) {
      formattedHistory.push({ role: 'user', content: msg.prompt });
      formattedHistory.push({ role: 'assistant', content: msg.response });
    }

    const aiResponse = await axios.post(`${AI_SERVICE_URL}/api/ai/pyq/chat/stream`, {
      message: message,
      chat_type: 'GLOBAL_LIBRARY',
      context_data: {},
      history: formattedHistory
    }, {
      headers: { 'Content-Type': 'application/json' },
      responseType: 'stream'
    });

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Session-ID', session.id);

    let fullAiResponse = '';

    aiResponse.data.on('data', (chunk) => {
      res.write(chunk);
      const strChunk = chunk.toString();
      if (strChunk.startsWith('data: ') && !strChunk.includes('[DONE]')) {
        try {
          const jsonStr = strChunk.replace('data: ', '').trim();
          if (jsonStr) {
            const data = JSON.parse(jsonStr);
            if (data.text) fullAiResponse += data.text;
          }
        } catch (e) { }
      }
    });

    aiResponse.data.on('end', async () => {
      await prisma.pyqChatMessage.create({
        data: {
          sessionId: session.id,
          prompt: message,
          response: fullAiResponse
        }
      });
      res.end();
    });

  } catch (error) {
    if (error.response) {
      console.error('Global Chat Error Axios:', error.response.status, error.response.data);
      res.status(500).json({ error: 'Failed to process chat: AI Service returned ' + error.response.status });
    } else if (error.code === 'ECONNREFUSED') {
      console.error('Global Chat Error: AI Service is not running on', AI_SERVICE_URL);
      res.status(503).json({ error: 'AI Service is not available. Please ensure the AI service is running on port 8001.' });
    } else {
      console.error('Global Chat Error:', error);
      res.status(500).json({ error: 'Failed to process chat: ' + error.message });
    }
  }
};

exports.paperChat = async (req, res) => {
  try {
    const { analysisId } = req.params;
    const { message, sessionId } = req.body;
    const userId = req.user.id;

    const analysis = await prisma.pYQAnalysisHistory.findUnique({
      where: { id: analysisId }
    });

    if (!analysis || analysis.userId !== userId) {
      return res.status(404).json({ error: 'Analysis not found or unauthorized' });
    }

    let session;
    if (sessionId) {
      session = await prisma.pyqChatSession.findUnique({ where: { id: sessionId } });
      if (!session || session.userId !== userId) {
        return res.status(403).json({ error: 'Invalid session' });
      }
    } else {
      session = await prisma.pyqChatSession.create({
        data: {
          userId,
          type: 'PAPER',
          analysisId
        }
      });
    }

    const history = await prisma.pyqChatMessage.findMany({
      where: { sessionId: session.id },
      orderBy: { timestamp: 'asc' },
      take: 10
    });

    const formattedHistory = [];
    for (const msg of history) {
      formattedHistory.push({ role: 'user', content: msg.prompt });
      formattedHistory.push({ role: 'assistant', content: msg.response });
    }

    // analysis.similarityResult is stored as {status, analytics, similarityResults: [...]}
    const storedResult = analysis.similarityResult || {};
    const innerAnalytics = storedResult.analytics || {};
    const contextData = {
      analytics: {
        overallRepetitionPercent: innerAnalytics.overallRepetitionPercent || analysis.overallRepetition || 0,
        fullyRepeated: innerAnalytics.fullyRepeated || 0,
        conceptRepeated: innerAnalytics.conceptRepeated || 0,
        newQuestions: innerAnalytics.newQuestions || 0,
      },
      similarityResults: Array.isArray(storedResult.similarityResults) ? storedResult.similarityResults : [],
      currentQuestions: analysis.extractedQuestions
    };

    const aiResponse = await axios.post(`${AI_SERVICE_URL}/api/ai/pyq/chat/stream`, {
      message: message,
      chat_type: 'PAPER_SPECIFIC',
      context_data: contextData,
      history: formattedHistory
    }, {
      headers: { 'Content-Type': 'application/json' },
      responseType: 'stream'
    });

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Session-ID', session.id);

    let fullAiResponse = '';

    aiResponse.data.on('data', (chunk) => {
      res.write(chunk);
      const strChunk = chunk.toString();
      if (strChunk.startsWith('data: ') && !strChunk.includes('[DONE]')) {
        try {
          const jsonStr = strChunk.replace('data: ', '').trim();
          if (jsonStr) {
            const data = JSON.parse(jsonStr);
            if (data.text) fullAiResponse += data.text;
          }
        } catch (e) { }
      }
    });

    aiResponse.data.on('end', async () => {
      await prisma.pyqChatMessage.create({
        data: {
          sessionId: session.id,
          prompt: message,
          response: fullAiResponse
        }
      });
      res.end();
    });

  } catch (error) {
    if (error.response) {
       console.error('Paper Chat Error Axios:', error.response.status, error.response.data);
       res.status(500).json({ error: 'Failed to process chat: AI Service returned ' + error.response.status });
    } else if (error.code === 'ECONNREFUSED') {
       console.error('Paper Chat Error: AI Service is not running on', AI_SERVICE_URL);
       res.status(503).json({ error: 'AI Service is not available. Please ensure the AI service is running on port 8001.' });
    } else {
       console.error('Paper Chat Error:', error);
       res.status(500).json({ error: 'Failed to process chat: ' + error.message });
    }
  }
};

