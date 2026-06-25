const prisma = require('../utils/prisma');
const { processQuestionPaper } = require('../services/pyqService');
const { generateQuestionRewrite, analyzeQuestionPaper, generateResponse } = require('../services/ai.service');
const { getFileTypeCategory } = require('../services/resourceService');
const path = require('path');
const fs = require('fs');

// ─── Dashboard ───────────────────────────────────────────────────
const getDashboard = async (req, res) => {
  try {
    const userId = req.user.id;

    const [paperCount, resourceCount, chatCount, recentPapers, recentResources] = await Promise.all([
      prisma.questionPaper.count({ where: { uploadedById: userId } }),
      prisma.resource.count({ where: { uploadedById: userId } }),
      prisma.chat.count({ where: { userId } }),
      prisma.questionPaper.findMany({
        where: { uploadedById: userId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: { subject: true }
      }),
      prisma.resource.findMany({
        where: { uploadedById: userId },
        orderBy: { createdAt: 'desc' },
        take: 5
      })
    ]);

    res.json({
      stats: {
        questionPapers: paperCount,
        resources: resourceCount,
        chats: chatCount
      },
      recentPapers,
      recentResources
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: 'Failed to load dashboard' });
  }
};

// ─── PYQ Upload ──────────────────────────────────────────────────
const uploadQuestionPaper = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { title, year, semester, subjectId } = req.body;

    if (!title || !year || !semester) {
      return res.status(400).json({ error: 'Title, year, and semester are required' });
    }

    const paper = await prisma.questionPaper.create({
      data: {
        title,
        year: parseInt(year),
        semester: parseInt(semester),
        filePath: req.file.path,
        originalFileName: req.file.originalname,
        subjectId: subjectId || null,
        uploadedById: req.user.id
      }
    });

    // Log the upload
    await prisma.auditLog.create({
      data: {
        action: 'UPLOAD_PYQ',
        entityType: 'QuestionPaper',
        entityId: paper.id,
        details: `Uploaded: ${title}`,
        userId: req.user.id
      }
    });

    // Process asynchronously (extract text, separate questions, find similarities)
    processQuestionPaper(paper.id).catch(err => {
      console.error('PYQ processing error:', err);
    });

    res.status(201).json({
      message: 'Question paper uploaded. Processing will begin shortly.',
      paper
    });
  } catch (error) {
    console.error('Upload PYQ error:', error);
    res.status(500).json({ error: 'Failed to upload question paper' });
  }
};

// ─── PYQ List ────────────────────────────────────────────────────
const listQuestionPapers = async (req, res) => {
  try {
    const papers = await prisma.questionPaper.findMany({
      where: { uploadedById: req.user.id },
      orderBy: { createdAt: 'desc' },
      include: {
        subject: true,
        _count: { select: { extractedQuestions: true } }
      }
    });

    res.json(papers);
  } catch (error) {
    console.error('List PYQ error:', error);
    res.status(500).json({ error: 'Failed to list question papers' });
  }
};

// ─── PYQ Detail ──────────────────────────────────────────────────
const getQuestionPaperDetail = async (req, res) => {
  try {
    const paper = await prisma.questionPaper.findUnique({
      where: { id: req.params.id },
      include: {
        subject: true,
        extractedQuestions: {
          include: {
            similarityAsSource: {
              include: {
                matchedQuestion: {
                  include: {
                    questionPaper: { select: { title: true, year: true, semester: true } }
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!paper) {
      return res.status(404).json({ error: 'Question paper not found' });
    }

    res.json(paper);
  } catch (error) {
    console.error('PYQ detail error:', error);
    res.status(500).json({ error: 'Failed to get question paper details' });
  }
};

// ─── AI Rewrite ──────────────────────────────────────────────────
const rewriteQuestion = async (req, res) => {
  try {
    const { question, marks, topic, difficulty } = req.body;

    if (!question) {
      return res.status(400).json({ error: 'Question text is required' });
    }

    const rewritten = await generateQuestionRewrite(question, { marks, topic, difficulty });

    res.json({ original: question, rewritten });
  } catch (error) {
    console.error('Rewrite error:', error);
    res.status(500).json({ error: 'Failed to rewrite question' });
  }
};

// ─── QP Chatbot ──────────────────────────────────────────────────
const questionPaperChat = async (req, res) => {
  try {
    const { paperId, message, history } = req.body;

    if (!paperId || !message) {
      return res.status(400).json({ error: 'paperId and message are required' });
    }

    const paper = await prisma.questionPaper.findUnique({
      where: { id: paperId },
      select: { extractedText: true }
    });

    if (!paper || !paper.extractedText) {
      return res.status(404).json({ error: 'Question paper not found or not yet processed' });
    }

    const reply = await analyzeQuestionPaper(paper.extractedText, message, history || []);

    res.json({ reply });
  } catch (error) {
    console.error('QP chat error:', error);
    res.status(500).json({ error: 'Failed to process question' });
  }
};

// ─── Resources: Upload ───────────────────────────────────────────
const uploadResource = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { title, description, department, semester, subjectName } = req.body;

    if (!title || !department || !semester || !subjectName) {
      return res.status(400).json({ error: 'Title, department, semester, and subject are required' });
    }

    const resource = await prisma.resource.create({
      data: {
        title,
        description: description || null,
        fileType: getFileTypeCategory(req.file.mimetype),
        filePath: req.file.path,
        originalFileName: req.file.originalname,
        fileSize: req.file.size,
        department,
        semester: parseInt(semester),
        subjectName,
        uploadedById: req.user.id
      }
    });

    await prisma.auditLog.create({
      data: {
        action: 'UPLOAD_RESOURCE',
        entityType: 'Resource',
        entityId: resource.id,
        details: `Uploaded: ${title}`,
        userId: req.user.id
      }
    });

    res.status(201).json(resource);
  } catch (error) {
    console.error('Upload resource error:', error);
    res.status(500).json({ error: 'Failed to upload resource' });
  }
};

// ─── Resources: List ─────────────────────────────────────────────
const listResources = async (req, res) => {
  try {
    const { department, semester, subject, search } = req.query;

    const where = {};

    if (department) where.department = department;
    if (semester) where.semester = parseInt(semester);
    if (subject) where.subjectName = { contains: subject };
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
        { subjectName: { contains: search } }
      ];
    }

    const resources = await prisma.resource.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        uploadedBy: { select: { name: true } }
      }
    });

    res.json(resources);
  } catch (error) {
    console.error('List resources error:', error);
    res.status(500).json({ error: 'Failed to list resources' });
  }
};

// ─── Resources: Delete ───────────────────────────────────────────
const deleteResource = async (req, res) => {
  try {
    const resource = await prisma.resource.findUnique({
      where: { id: req.params.id }
    });

    if (!resource) {
      return res.status(404).json({ error: 'Resource not found' });
    }

    if (resource.uploadedById !== req.user.id) {
      return res.status(403).json({ error: 'You can only delete your own resources' });
    }

    // Delete file from disk
    if (fs.existsSync(resource.filePath)) {
      fs.unlinkSync(resource.filePath);
    }

    await prisma.resource.delete({ where: { id: req.params.id } });

    await prisma.auditLog.create({
      data: {
        action: 'DELETE_RESOURCE',
        entityType: 'Resource',
        entityId: req.params.id,
        details: `Deleted: ${resource.title}`,
        userId: req.user.id
      }
    });

    res.json({ message: 'Resource deleted' });
  } catch (error) {
    console.error('Delete resource error:', error);
    res.status(500).json({ error: 'Failed to delete resource' });
  }
};

// ─── Subjects: List ──────────────────────────────────────────────
const listSubjects = async (req, res) => {
  try {
    const subjects = await prisma.subject.findMany({
      orderBy: [{ department: 'asc' }, { semester: 'asc' }, { name: 'asc' }]
    });
    res.json(subjects);
  } catch (error) {
    console.error('List subjects error:', error);
    res.status(500).json({ error: 'Failed to list subjects' });
  }
};

// ─── Teacher Chat (reuses existing chat system) ──────────────────
const teacherChat = async (req, res) => {
  const { message, chatId, history } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  try {
    const userId = req.user.id;
    let currentChatId = chatId;

    if (!currentChatId) {
      const newChat = await prisma.chat.create({
        data: { userId, title: message.substring(0, 30) }
      });
      currentChatId = newChat.id;
    }

    await prisma.message.create({
      data: { chatId: currentChatId, role: 'user', content: message }
    });

    const aiResponse = await generateResponse(message, 'TEACHER', history || []);

    await prisma.message.create({
      data: { chatId: currentChatId, role: 'assistant', content: aiResponse }
    });

    res.json({ chatId: currentChatId, reply: aiResponse });
  } catch (error) {
    console.error('Teacher chat error:', error);
    res.status(500).json({ error: 'Failed to process chat' });
  }
};

// ─── Teacher Chat History ────────────────────────────────────────
const getTeacherChats = async (req, res) => {
  try {
    const chats = await prisma.chat.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      include: { messages: { orderBy: { createdAt: 'asc' } } }
    });
    res.json(chats);
  } catch (error) {
    console.error('Teacher chats error:', error);
    res.status(500).json({ error: 'Failed to get chats' });
  }
};

// ─── Rename Chat ─────────────────────────────────────────────────
const renameChat = async (req, res) => {
  try {
    const { title } = req.body;
    const chat = await prisma.chat.findUnique({ where: { id: req.params.id } });
    
    if (!chat || chat.userId !== req.user.id) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    const updated = await prisma.chat.update({
      where: { id: req.params.id },
      data: { title }
    });

    res.json(updated);
  } catch (error) {
    console.error('Rename chat error:', error);
    res.status(500).json({ error: 'Failed to rename chat' });
  }
};

// ─── Delete Chat ─────────────────────────────────────────────────
const deleteChat = async (req, res) => {
  try {
    const chat = await prisma.chat.findUnique({ where: { id: req.params.id } });
    
    if (!chat || chat.userId !== req.user.id) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    await prisma.chat.delete({ where: { id: req.params.id } });
    res.json({ message: 'Chat deleted' });
  } catch (error) {
    console.error('Delete chat error:', error);
    res.status(500).json({ error: 'Failed to delete chat' });
  }
};

// ─── Save Streamed Chat ────────────────────────────────────────────
const saveStreamedChat = async (req, res) => {
  try {
    const { chatId, title, messages } = req.body;
    const userId = req.user.id;
    let currentChatId = chatId;

    if (!currentChatId || currentChatId.startsWith('chat_')) {
      const newChat = await prisma.chat.create({
        data: { userId, title: title || 'New Chat' }
      });
      currentChatId = newChat.id;
    }

    // Insert only the new messages (usually the last 2: user and assistant)
    for (const msg of messages) {
      await prisma.message.create({
        data: {
          chatId: currentChatId,
          role: msg.role,
          content: msg.content,
          fileReferences: msg.files ? JSON.stringify(msg.files) : null
        }
      });
    }

    res.json({ chatId: currentChatId });
  } catch (error) {
    console.error('Save streamed chat error:', error);
    res.status(500).json({ error: 'Failed to save chat' });
  }
};

module.exports = {
  getDashboard,
  uploadQuestionPaper,
  listQuestionPapers,
  getQuestionPaperDetail,
  rewriteQuestion,
  questionPaperChat,
  uploadResource,
  listResources,
  deleteResource,
  listSubjects,
  teacherChat,
  saveStreamedChat,
  getTeacherChats,
  renameChat,
  deleteChat
};
