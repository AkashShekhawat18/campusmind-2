const express = require('express');
const router = express.Router();
const { requireRole } = require('../middleware/roleAuth');
const { protect } = require('../middleware/auth');
const { validateUUID } = require('../middleware/validation');
const {
  getStats,
  getUsers,
  updateUser,
  deleteUser,
  suspendUser,
  getApprovals,
  updateApproval,
  getGptHistory,
  getSettings,
  updateSetting,
  sendNotification,
  getNotifications,
  updateUserPassword
} = require('../controllers/adminController');

router.use(protect);
router.use(requireRole('ADMIN'));

router.get('/stats', getStats);
router.get('/users', getUsers);
router.put('/users/:id', validateUUID(), updateUser);
router.put('/users/:id/password', validateUUID(), updateUserPassword);
router.put('/users/:id/suspend', validateUUID(), suspendUser);
router.delete('/users/:id', validateUUID(), deleteUser);
router.get('/approvals', getApprovals);
router.put('/approvals/:id', validateUUID(), updateApproval);
router.get('/gpt/history', getGptHistory);
router.get('/settings', getSettings);
router.put('/settings', updateSetting);
router.get('/notifications', getNotifications);
router.post('/notifications', sendNotification);

module.exports = router;
