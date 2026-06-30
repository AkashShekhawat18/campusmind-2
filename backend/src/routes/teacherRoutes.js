const express = require('express');
const { protect } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleAuth');
const { pyqUpload, resourceUpload } = require('../services/resourceService');
const {
  getDashboard,
  bulkUploadPYQ,
  analyzeCurrentPaper,
  listQuestionPapers,
  getQuestionPaperDetail,
  deleteQuestionPaper,
  rewriteQuestion,
  getAnalytics,
  searchQuestions,
  generateAnswer,
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

const {
  getEvents,
  createEvent,
  deleteEvent
} = require('../controllers/calendarController');

const router = express.Router();

// All teacher routes require authentication + TEACHER role
router.use(protect, requireRole('TEACHER'));

// Dashboard
router.get('/dashboard', getDashboard);

// Subjects
router.get('/subjects', listSubjects);

// PYQ Routes
router.post('/pyq/bulk-upload', pyqUpload.single('file'), bulkUploadPYQ);
router.post('/pyq/analyze-current', pyqUpload.single('file'), analyzeCurrentPaper);
router.get('/pyq/papers', listQuestionPapers);
router.get('/pyq/papers/:id', getQuestionPaperDetail);
router.delete('/pyq/papers/:id', deleteQuestionPaper);
router.post('/pyq/rewrite', rewriteQuestion);
router.post('/pyq/answer', generateAnswer);
router.post('/pyq/chat', questionPaperChat);
router.get('/pyq/analytics', getAnalytics);
router.get('/pyq/search', searchQuestions);

// Resource Routes
router.post('/resources/upload', resourceUpload.single('file'), uploadResource);
router.get('/resources', listResources);
router.delete('/resources/:id', deleteResource);

// Chat Routes (teacher-specific Campus GPT)
router.post('/chat', teacherChat);
router.post('/chat/save', require('../controllers/teacherController').saveStreamedChat);
router.get('/chat/history', getTeacherChats);
router.put('/chat/:id', renameChat);
router.delete('/chat/:id', deleteChat);

// Calendar Routes
router.get('/calendar/schedule', getEvents);
router.post('/calendar/schedule', createEvent);
router.delete('/calendar/schedule/:id', deleteEvent);

module.exports = router;
