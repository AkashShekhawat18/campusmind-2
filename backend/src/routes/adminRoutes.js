const express = require('express');
const router = express.Router();
const { requireRole } = require('../middleware/roleAuth');
const { protect } = require('../middleware/auth');
const {
  getStats,
  getUsers,
  updateUser,
  deleteUser,
  getApprovals,
  updateApproval,
  getGptHistory,
  getSettings,
  updateSetting,
  sendNotification,
  getNotifications
} = require('../controllers/adminController');

router.use(protect);
router.use(requireRole('ADMIN'));

router.get('/stats', getStats);
router.get('/users', getUsers);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);
router.get('/approvals', getApprovals);
router.put('/approvals/:id', updateApproval);
router.get('/gpt/history', getGptHistory);
router.get('/settings', getSettings);
router.put('/settings', updateSetting);
router.get('/notifications', getNotifications);
router.post('/notifications', sendNotification);

module.exports = router;
