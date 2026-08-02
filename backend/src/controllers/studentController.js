const prisma = require('../utils/prisma');
const axios = require('axios');
const { generateResponse } = require('../services/ai.service');

// ─── Dashboard ───────────────────────────────────────────────────
const getDashboard = async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    const recentResources = await prisma.recentResource.findMany({
      where: { userId },
      include: { resource: true },
      orderBy: { viewedAt: 'desc' },
      take: 5
    });

    const recentChats = await prisma.chat.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    const bookmarksCount = await prisma.bookmark.count({ where: { userId } });
    const resourcesCount = await prisma.resource.count();

    res.json({
      recentResources: recentResources.map(rr => rr.resource),
      recentChats,
      stats: {
        bookmarksCount,
        totalLibraryResources: resourcesCount
      }
    });
  } catch (error) {
    next(error);
  }
};

// ─── Profile ─────────────────────────────────────────────────────
const getProfile = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { studentProfile: true }
    });
    res.json(user);
  } catch (error) {
    next(error);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const { department, semester, course, bio } = req.body;
    
    let profile = await prisma.studentProfile.findUnique({ where: { userId: req.user.id } });
    
    if (profile) {
      profile = await prisma.studentProfile.update({
        where: { userId: req.user.id },
        data: { department, semester: parseInt(semester) || null, course, bio }
      });
    } else {
      profile = await prisma.studentProfile.create({
        data: { userId: req.user.id, department, semester: parseInt(semester) || null, course, bio }
      });
    }
    
    res.json(profile);
  } catch (error) {
    next(error);
  }
};

// ─── Settings ────────────────────────────────────────────────────
const getSettings = async (req, res, next) => {
  try {
    let settings = await prisma.studentSettings.findUnique({ where: { userId: req.user.id } });
    if (!settings) {
      settings = await prisma.studentSettings.create({ data: { userId: req.user.id } });
    }
    res.json(settings);
  } catch (error) {
    next(error);
  }
};

const updateSettings = async (req, res, next) => {
  try {
    const { theme, notifications, language } = req.body;
    const settings = await prisma.studentSettings.update({
      where: { userId: req.user.id },
      data: { theme, notifications, language }
    });
    res.json(settings);
  } catch (error) {
    next(error);
  }
};

// ─── Resources ───────────────────────────────────────────────────
const listResources = async (req, res, next) => {
  try {
    let limit = parseInt(req.query.limit) || 50;
    if (limit > 200) limit = 200;
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * limit;

    const resources = await prisma.resource.findMany({
      take: limit,
      skip,
      orderBy: { createdAt: 'desc' },
      include: {
        uploadedBy: { select: { name: true } },
        bookmarks: { where: { userId: req.user.id } }
      }
    });
    
    // Format to indicate if current student bookmarked it
    const formatted = resources.map(r => ({
      ...r,
      isBookmarked: r.bookmarks.length > 0
    }));
    
    res.json(formatted);
  } catch (error) {
    next(error);
  }
};

const bookmarkResource = async (req, res, next) => {
  try {
    const { id } = req.params;
    await prisma.bookmark.create({
      data: { userId: req.user.id, resourceId: id }
    });
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};

const unbookmarkResource = async (req, res, next) => {
  try {
    const { id } = req.params;
    await prisma.bookmark.deleteMany({
      where: { userId: req.user.id, resourceId: id }
    });
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};

const downloadResource = async (req, res, next) => {
  try {
    const { id } = req.params;
    await prisma.downloadedResource.create({
      data: { userId: req.user.id, resourceId: id }
    });
    
    await prisma.studentActivity.create({
      data: { userId: req.user.id, action: 'DOWNLOAD_RESOURCE', details: id }
    });
    
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};

const getBookmarks = async (req, res, next) => {
  try {
    let limit = parseInt(req.query.limit) || 50;
    if (limit > 200) limit = 200;
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * limit;

    const bookmarks = await prisma.bookmark.findMany({
      take: limit,
      skip,
      where: { userId: req.user.id },
      include: { resource: true, questionPaper: true }
    });
    res.json(bookmarks);
  } catch (error) {
    next(error);
  }
};

// ─── Campus GPT (Student) ────────────────────────────────────────
const studentChat = async (req, res, next) => {
  const { message, chatId, history } = req.body;
  if (!message) return res.status(400).json({ error: 'Message is required' });

  try {
    const userId = req.user.id;
    let currentChatId = chatId;

    if (!currentChatId) {
      await prisma.$transaction(async (tx) => {
        const newChat = await tx.chat.create({
          data: { userId, title: message.substring(0, 30) }
        });
        currentChatId = newChat.id;
        await tx.message.create({
          data: { chatId: currentChatId, role: 'user', content: message }
        });
      });
    } else {
      await prisma.message.create({
        data: { chatId: currentChatId, role: 'user', content: message }
      });
    }

    const aiResponse = await generateResponse(message, 'STUDENT', history || []);

    await prisma.message.create({
      data: { chatId: currentChatId, role: 'assistant', content: aiResponse }
    });

    await prisma.studentActivity.create({
      data: { userId, action: 'AI_CHAT', details: currentChatId }
    });

    res.json({ chatId: currentChatId, reply: aiResponse });
  } catch (error) {
    next(error);
  }
};

const getStudentChats = async (req, res, next) => {
  try {
    let limit = parseInt(req.query.limit) || 50;
    if (limit > 200) limit = 200;
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * limit;

    const chats = await prisma.chat.findMany({
      take: limit,
      skip,
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      include: { messages: { orderBy: { createdAt: 'asc' } } }
    });
    res.json(chats);
  } catch (error) {
    next(error);
  }
};

const renameChat = async (req, res, next) => {
  try {
    const { title } = req.body;
    const chat = await prisma.chat.updateMany({
      where: { id: req.params.id, userId: req.user.id },
      data: { title }
    });
    res.json(chat);
  } catch (error) {
    next(error);
  }
};

const deleteChat = async (req, res, next) => {
  try {
    const chatId = req.params.id;
    if (!chatId) return res.status(400).json({ error: 'Chat ID required' });

    if (!chatId.startsWith('chat_')) {
      await prisma.chat.deleteMany({
        where: { id: chatId, userId: req.user.id }
      });
    }

    // Purge vector store embeddings for this chat_id in Python AI microservice
    try {
      await axios.post('http://127.0.0.1:8000/api/ai/chat/delete', 
        new URLSearchParams({ user_id: req.user.id, chat_id: chatId }).toString(),
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
      );
    } catch (aiErr) {
      console.warn('[AI Service Memory Purge Warning]:', aiErr.message);
    }

    res.json({ success: true, message: 'Chat permanently deleted' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboard,
  getProfile,
  updateProfile,
  getSettings,
  updateSettings,
  listResources,
  bookmarkResource,
  unbookmarkResource,
  downloadResource,
  getBookmarks,
  studentChat,
  getStudentChats,
  renameChat,
  deleteChat
};
