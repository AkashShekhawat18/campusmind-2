const express = require('express');
const { protect } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleAuth');
const { pyqUpload, resourceUpload } = require('../services/resourceService');
const {
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
  getTeacherChats,
  renameChat,
  deleteChat
} = require('../controllers/teacherController');

const router = express.Router();

// All teacher routes require authentication + TEACHER role
router.use(protect, requireRole('TEACHER'));

// Dashboard
router.get('/dashboard', getDashboard);

// Subjects
router.get('/subjects', listSubjects);

// PYQ Routes
router.post('/pyq/upload', pyqUpload.single('file'), uploadQuestionPaper);
router.get('/pyq/papers', listQuestionPapers);
router.get('/pyq/papers/:id', getQuestionPaperDetail);
router.post('/pyq/rewrite', rewriteQuestion);
router.post('/pyq/chat', questionPaperChat);

// Resource Routes
router.post('/resources/upload', resourceUpload.single('file'), uploadResource);
router.get('/resources', listResources);
router.delete('/resources/:id', deleteResource);

// Chat Routes (teacher-specific Campus GPT)
router.post('/chat', teacherChat);
router.get('/chat/history', getTeacherChats);
router.put('/chat/:id', renameChat);
router.delete('/chat/:id', deleteChat);

module.exports = router;
