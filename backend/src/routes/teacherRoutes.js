const express = require('express');
const { protect } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleAuth');
const { validateUUID } = require('../middleware/validation');
const { resourceUpload } = require('../services/resourceService');
const {
  getDashboard,
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

// Resource Routes
router.post('/resources/upload', resourceUpload.single('file'), uploadResource);
router.get('/resources', listResources);
router.delete('/resources/:id', validateUUID(), deleteResource);

// Chat Routes (teacher-specific Campus GPT)
router.post('/chat', teacherChat);
router.post('/chat/save', require('../controllers/teacherController').saveStreamedChat);
router.get('/chat/history', getTeacherChats);
router.put('/chat/:id', validateUUID(), renameChat);
router.delete('/chat/:id', validateUUID(), deleteChat);

module.exports = router;
