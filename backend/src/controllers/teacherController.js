const prisma = require('../utils/prisma');
const axios = require('axios');
const { generateResponse } = require('../services/ai.service');
const { getFileTypeCategory } = require('../services/resourceService');
// ─── Dashboard ───────────────────────────────────────────────────
const getDashboard = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const [resourceCount, chatCount, recentResources] = await Promise.all([
      prisma.resource.count({ where: { uploadedById: userId } }),
      prisma.chat.count({ where: { userId } }),
      prisma.resource.findMany({
        where: { uploadedById: userId },
        orderBy: { createdAt: 'desc' },
        take: 5
      })
    ]);

    res.json({
      stats: {
        resources: resourceCount,
        chats: chatCount
      },
      recentResources
    });
  } catch (error) {
    next(error);
  }
};


// ─── Resources: Upload ───────────────────────────────────────────
const cloudinary = require('../utils/cloudinary');
const streamifier = require('streamifier');

const uploadToCloudinary = (buffer, originalname) => {
  return new Promise((resolve, reject) => {
    const ext = originalname ? require('path').extname(originalname) : '.pdf';
    const public_id = `file_${Date.now()}${ext}`;
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: 'malphor/teacher_resources', resource_type: 'raw', public_id },
      (error, result) => {
        if (result) resolve(result);
        else reject(error);
      }
    );
    streamifier.createReadStream(buffer).pipe(uploadStream);
  });
};

const uploadResource = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { title, description, department, semester, subjectName } = req.body;

    if (!title || !department || !semester || !subjectName) {
      return res.status(400).json({ error: 'Title, department, semester, and subject are required' });
    }

    const uploadResult = await uploadToCloudinary(req.file.buffer, req.file.originalname);
    const filePath = uploadResult.secure_url;

    try {
      const resource = await prisma.resource.create({
        data: {
          title,
          description: description || null,
          fileType: getFileTypeCategory(req.file.mimetype),
          filePath,
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
    } catch (dbError) {
      console.error('Failed to create resource in DB:', dbError);
      throw dbError;
    }
  } catch (error) {
    next(error);
  }
};

// ─── Resources: List ─────────────────────────────────────────────
const listResources = async (req, res, next) => {
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

    let limit = parseInt(req.query.limit) || 50;
    if (limit > 200) limit = 200;
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * limit;

    const resources = await prisma.resource.findMany({
      take: limit,
      skip,
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        uploadedBy: { select: { name: true } }
      }
    });

    res.json(resources);
  } catch (error) {
    next(error);
  }
};

// ─── Resources: Delete ───────────────────────────────────────────
const deleteResource = async (req, res, next) => {
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

    // Attempting to extract public_id from secure_url to delete from Cloudinary
    // Example: https://res.cloudinary.com/demo/image/upload/v1234/malphor/teacher_resources/abc.pdf
    try {
      const urlParts = resource.filePath.split('/');
      const filenameWithExt = urlParts[urlParts.length - 1];
      const filename = filenameWithExt.split('.')[0];
      const folder = 'malphor/teacher_resources'; 
      await cloudinary.uploader.destroy(`${folder}/${filename}`, { resource_type: 'raw' }); // mostly raw for pdfs/docs
    } catch (err) {
      console.warn("Could not delete from Cloudinary, continuing DB deletion", err);
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
    next(error);
  }
};

// ─── Subjects: List ──────────────────────────────────────────────
const listSubjects = async (req, res, next) => {
  try {
    let limit = parseInt(req.query.limit) || 50;
    if (limit > 200) limit = 200;
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * limit;

    const subjects = await prisma.subject.findMany({
      take: limit,
      skip,
      orderBy: [{ department: 'asc' }, { semester: 'asc' }, { name: 'asc' }]
    });
    res.json(subjects);
  } catch (error) {
    next(error);
  }
};

// ─── Teacher Chat (reuses existing chat system) ──────────────────
const teacherChat = async (req, res, next) => {
  const { message, chatId, history } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

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

    const aiResponse = await generateResponse(message, 'TEACHER', history || []);

    await prisma.message.create({
      data: { chatId: currentChatId, role: 'assistant', content: aiResponse }
    });

    res.json({ chatId: currentChatId, reply: aiResponse });
  } catch (error) {
    next(error);
  }
};

// ─── Teacher Chat History ────────────────────────────────────────
const getTeacherChats = async (req, res, next) => {
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

// ─── Rename Chat ─────────────────────────────────────────────────
const renameChat = async (req, res, next) => {
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
    next(error);
  }
};

// ─── Delete Chat ─────────────────────────────────────────────────
const deleteChat = async (req, res, next) => {
  try {
    const chatId = req.params.id;
    if (!chatId) return res.status(400).json({ error: 'Chat ID required' });

    // Handles temporary unsaved frontend IDs starting with chat_
    if (!chatId.startsWith('chat_')) {
      const chat = await prisma.chat.findUnique({ where: { id: chatId } });
      
      if (chat && chat.userId === req.user.id) {
        await prisma.chat.delete({ where: { id: chatId } });
      }
    }

    // Purge vector store embeddings for this chat_id in Python AI microservice
    try {
      await axios.post('http://127.0.0.1:8001/api/ai/chat/delete', 
        new URLSearchParams({ user_id: req.user.id, chat_id: chatId }).toString(),
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
      );
    } catch (aiErr) {
      console.warn('[AI Service Memory Purge Warning]:', aiErr.message);
    }

    res.json({ message: 'Chat permanently deleted' });
  } catch (error) {
    next(error);
  }
};

// ─── Save Streamed Chat ────────────────────────────────────────────
const saveStreamedChat = async (req, res, next) => {
  try {
    const { chatId, title, messages } = req.body;
    const userId = req.user.id;
    let currentChatId = chatId;

    if (!currentChatId || currentChatId.startsWith('chat_')) {
      await prisma.$transaction(async (tx) => {
        const newChat = await tx.chat.create({
          data: { userId, title: title || 'New Chat' }
        });
        currentChatId = newChat.id;

        for (const msg of messages) {
          await tx.message.create({
            data: {
              chatId: currentChatId,
              role: msg.role,
              content: msg.content,
              fileReferences: msg.files ? JSON.stringify(msg.files) : null
            }
          });
        }
      });
    } else {
      await prisma.$transaction(async (tx) => {
        for (const msg of messages) {
          await tx.message.create({
            data: {
              chatId: currentChatId,
              role: msg.role,
              content: msg.content,
              fileReferences: msg.files ? JSON.stringify(msg.files) : null
            }
          });
        }
      });
    }

    res.json({ chatId: currentChatId });
  } catch (error) {
    next(error);
  }
};



module.exports = {
  getDashboard,
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
