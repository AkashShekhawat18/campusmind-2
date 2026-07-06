const express = require('express');
const { protect } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleAuth');
const { validateUUID } = require('../middleware/validation');
const {
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
} = require('../controllers/studentController');

const router = express.Router();

// All student routes require authentication + STUDENT role
router.use(protect, requireRole('STUDENT'));

// Dashboard
router.get('/dashboard', getDashboard);

// Profile
router.get('/profile', getProfile);
router.put('/profile', updateProfile);

// Settings
router.get('/settings', getSettings);
router.put('/settings', updateSettings);

// Resources
router.get('/resources', listResources);
router.post('/resources/:id/bookmark', validateUUID(), bookmarkResource);
router.delete('/resources/:id/bookmark', validateUUID(), unbookmarkResource);
router.post('/resources/:id/download', validateUUID(), downloadResource);

// Bookmarks
router.get('/bookmarks', getBookmarks);

// Campus GPT (Student Version)
router.post('/chat', studentChat);
router.post('/chat/save', require('../controllers/teacherController').saveStreamedChat); // Shared logic
router.get('/chat/history', getStudentChats);
router.put('/chat/:id', validateUUID(), renameChat);
router.delete('/chat/:id', validateUUID(), deleteChat);

module.exports = router;
