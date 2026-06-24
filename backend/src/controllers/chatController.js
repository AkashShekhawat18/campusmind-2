const prisma = require('../utils/prisma');
const { generateResponse } = require('../services/ai.service');

const handleChat = async (req, res) => {
  const { message, chatId, mode, history } = req.body;
  
  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  try {
    // If guest mode (no token or invalid token)
    if (!req.user) {
      const aiResponse = await generateResponse(message, mode, history);
      return res.json({ reply: aiResponse });
    }

    const userId = req.user.id;
    let currentChatId = chatId;
    
    // Create new chat if not provided
    if (!currentChatId) {
      const newChat = await prisma.chat.create({
        data: {
          userId,
          title: message.substring(0, 30)
        }
      });
      currentChatId = newChat.id;
    }

    // Save user message
    await prisma.message.create({
      data: {
        chatId: currentChatId,
        role: 'user',
        content: message
      }
    });

    // Get Gemini response
    const aiResponse = await generateResponse(message, mode, history);

    // Save AI message
    await prisma.message.create({
      data: {
        chatId: currentChatId,
        role: 'assistant',
        content: aiResponse
      }
    });

    res.json({
      chatId: currentChatId,
      reply: aiResponse
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error while processing chat' });
  }
};

const getChats = async (req, res) => {
  try {
    const chats = await prisma.chat.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      include: {
        messages: true
      }
    });
    res.json(chats);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = {
  handleChat,
  getChats
};
