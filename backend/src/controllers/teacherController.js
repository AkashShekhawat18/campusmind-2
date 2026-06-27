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

// ─── Bulk Upload PYQ (Historical) ──────────────────────────────────────────────────
const bulkUploadPYQ = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const { title, year, semester, subjectId } = req.body;
    if (!title || !year || !semester) return res.status(400).json({ error: 'Title, year, and semester are required' });

    const paper = await prisma.questionPaper.create({
      data: {
        title, year: parseInt(year), semester: parseInt(semester),
        filePath: req.file.path, originalFileName: req.file.originalname,
        subjectId: subjectId || null, uploadedById: req.user.id,
        uploadType: 'HISTORICAL'
      }
    });

    processQuestionPaper(paper.id).catch(err => console.error('Bulk PYQ processing error:', err));

    res.status(201).json({ message: 'Historical paper added to database. Processing started.', paper });
  } catch (error) {
    console.error('Bulk Upload PYQ error:', error);
    res.status(500).json({ error: 'Failed to upload historical question paper' });
  }
};

// ─── Analyze Current Paper ──────────────────────────────────────────────────────
const analyzeCurrentPaper = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const { title, year, semester, subjectId } = req.body;
    
    const paper = await prisma.questionPaper.create({
      data: {
        title: title || 'Current Analysis', year: parseInt(year) || new Date().getFullYear(), 
        semester: parseInt(semester) || 1, filePath: req.file.path, 
        originalFileName: req.file.originalname, subjectId: subjectId || null, 
        uploadedById: req.user.id, uploadType: 'CURRENT_ANALYSIS'
      }
    });

    processQuestionPaper(paper.id).catch(err => console.error('Current PYQ processing error:', err));

    res.status(201).json({ message: 'Current paper uploaded for analysis. Analytics generation started.', paper });
  } catch (error) {
    console.error('Analyze Current Paper error:', error);
    res.status(500).json({ error: 'Failed to upload current question paper' });
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
        _count: { select: { extractedQuestions: true } },
        analytics: true
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

// ─── PYQ Delete ──────────────────────────────────────────────────
const deleteQuestionPaper = async (req, res) => {
  try {
    const paper = await prisma.questionPaper.findUnique({
      where: { id: req.params.id }
    });

    if (!paper) {
      return res.status(404).json({ error: 'Question paper not found' });
    }

    if (paper.uploadedById !== req.user.id) {
      return res.status(403).json({ error: 'You can only delete your own papers' });
    }

    if (fs.existsSync(paper.filePath)) {
      fs.unlinkSync(paper.filePath);
    }

    await prisma.questionPaper.delete({ where: { id: req.params.id } });

    await prisma.auditLog.create({
      data: {
        action: 'DELETE_PYQ',
        entityType: 'QuestionPaper',
        entityId: req.params.id,
        details: `Deleted PYQ: ${paper.title}`,
        userId: req.user.id
      }
    });

    res.json({ message: 'Question paper deleted successfully' });
  } catch (error) {
    console.error('Delete PYQ error:', error);
    res.status(500).json({ error: 'Failed to delete question paper' });
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

// ─── AI Model Answer ──────────────────────────────────────────────
const generateAnswer = async (req, res) => {
  try {
    const { question, format, questionId } = req.body;

    if (!question) {
      return res.status(400).json({ error: 'Question text is required' });
    }

    // Since we generated it from ai-service previously, let's proxy it to python service or local ai.service
    const { generateModelAnswer } = require('../services/ai.service');
    const content = await generateModelAnswer(question, format);

    if (questionId) {
      await prisma.modelAnswer.create({
        data: {
          extractedQuestionId: questionId,
          answerType: format || 'DETAILED',
          content
        }
      });
    }

    res.json({ answer: content });
  } catch (error) {
    console.error('Generate answer error:', error);
    res.status(500).json({ error: 'Failed to generate model answer' });
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
      include: {
        extractedQuestions: {
          orderBy: { questionNumber: 'asc' }
        }
      }
    });

    if (!paper || !paper.extractedQuestions || paper.extractedQuestions.length === 0) {
      return res.status(404).json({ error: 'Question paper not found or has no extracted questions yet.' });
    }

    // Format the questions into a clean text block for the AI to understand
    const paperContext = paper.extractedQuestions.map((q, i) => {
      let qText = `Question ${q.questionNumber || (i + 1)}: ${q.questionText}`;
      if (q.marks) qText += ` [${q.marks} Marks]`;
      if (q.topic) qText += ` (Topic: ${q.topic})`;
      return qText;
    }).join('\n\n');

    const { analyzeQuestionPaper } = require('../services/ai.service');
    const reply = await analyzeQuestionPaper(paperContext, message, history || []);

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

// ─── Analytics & Search ──────────────────────────────────────────────────
const getAnalytics = async (req, res) => {
  try {
    const analytics = await prisma.paperAnalytics.findMany({
      include: {
        questionPaper: {
          select: { title: true, year: true, semester: true }
        }
      }
    });
    res.json({ status: 'success', analytics });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ error: 'Failed to load analytics' });
  }
};

const searchQuestions = async (req, res) => {
  try {
    const { q, subject, year } = req.query;
    const where = {};
    if (q) {
      where.questionText = { contains: q };
    }
    
    const questions = await prisma.extractedQuestion.findMany({
      where,
      include: { questionPaper: true },
      take: 50
    });
    res.json({ status: 'success', questions });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Failed to search questions' });
  }
};

module.exports = {
  getDashboard,
  bulkUploadPYQ,
  analyzeCurrentPaper,
  listQuestionPapers,
  getQuestionPaperDetail,
  deleteQuestionPaper,
  rewriteQuestion,
  generateAnswer,
  questionPaperChat,
  uploadResource,
  listResources,
  deleteResource,
  listSubjects,
  teacherChat,
  saveStreamedChat,
  getTeacherChats,
  renameChat,
  deleteChat,
  getAnalytics,
  searchQuestions
};
