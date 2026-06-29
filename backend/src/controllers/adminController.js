const prisma = require('../utils/prisma');

const logAdminAction = async (userId, action, entityType, entityId, details) => {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        action,
        entityType,
        entityId,
        details
      }
    });
  } catch (error) {
    console.error('Failed to log admin action', error);
  }
};

const getStats = async (req, res) => {
  try {
    const totalUsers = await prisma.user.count();
    const activeApprovals = await prisma.approval.count({ where: { status: 'PENDING' } });
    const gptQueries = await prisma.message.count({ where: { role: 'user' } });
    
    // Simulate system health
    const systemHealth = 99.9;

    res.json({
      totalUsers,
      activeApprovals,
      gptQueries,
      systemHealth
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({ error: 'Server error fetching stats' });
  }
};

const getUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Server error fetching users' });
  }
};

const updateUser = async (req, res) => {
  const { id } = req.params;
  const { role, name, email } = req.body;
  try {
    const user = await prisma.user.update({
      where: { id },
      data: { role, name, email }
    });
    await logAdminAction(req.user.id, 'UPDATE_USER', 'User', id, `Updated role to ${role}`);
    res.json(user);
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Server error updating user' });
  }
};

const deleteUser = async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.user.delete({ where: { id } });
    await logAdminAction(req.user.id, 'DELETE_USER', 'User', id, 'Deleted user account');
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Server error deleting user' });
  }
};

const getApprovals = async (req, res) => {
  try {
    const approvals = await prisma.approval.findMany({
      orderBy: { createdAt: 'desc' }
    });
    // We should also fetch the user details for these approvals
    const enrichedApprovals = await Promise.all(approvals.map(async (appr) => {
      let details = {};
      if (appr.entityType === 'STUDENT' || appr.entityType === 'TEACHER') {
        const user = await prisma.user.findUnique({ where: { id: appr.entityId }, select: { name: true, email: true } });
        details = user || {};
      }
      return { ...appr, ...details };
    }));

    res.json(enrichedApprovals);
  } catch (error) {
    console.error('Error fetching approvals:', error);
    res.status(500).json({ error: 'Server error fetching approvals' });
  }
};

const updateApproval = async (req, res) => {
  const { id } = req.params;
  const { status, reviewNotes } = req.body;
  try {
    const approval = await prisma.approval.update({
      where: { id },
      data: { status, reviewNotes, reviewedBy: req.user.id }
    });
    await logAdminAction(req.user.id, 'UPDATE_APPROVAL', 'Approval', id, `Changed status to ${status}`);
    res.json(approval);
  } catch (error) {
    console.error('Error updating approval:', error);
    res.status(500).json({ error: 'Server error updating approval' });
  }
};

const getGptHistory = async (req, res) => {
  try {
    const chats = await prisma.chat.findMany({
      include: {
        user: { select: { name: true, email: true, role: true } },
        messages: {
          orderBy: { createdAt: 'asc' }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 50 // Limit to recent 50 for performance
    });
    res.json(chats);
  } catch (error) {
    console.error('Error fetching GPT history:', error);
    res.status(500).json({ error: 'Server error fetching GPT history' });
  }
};

const getSettings = async (req, res) => {
  try {
    const settings = await prisma.systemSetting.findMany();
    // Convert array of {key, value} into an object { [key]: value }
    const settingsObj = {};
    settings.forEach(s => { settingsObj[s.key] = s.value; });
    res.json(settingsObj);
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ error: 'Server error fetching settings' });
  }
};

const updateSetting = async (req, res) => {
  const { key, value } = req.body;
  try {
    const setting = await prisma.systemSetting.upsert({
      where: { key },
      update: { value: String(value) },
      create: { key, value: String(value) }
    });
    await logAdminAction(req.user.id, 'UPDATE_SETTING', 'SystemSetting', key, `Changed ${key} to ${value}`);
    res.json(setting);
  } catch (error) {
    console.error('Error updating setting:', error);
    res.status(500).json({ error: 'Server error updating setting' });
  }
};

const sendNotification = async (req, res) => {
  const { title, message, type, target, userId } = req.body;
  try {
    const notification = await prisma.notification.create({
      data: {
        title,
        message,
        type: type || 'ANNOUNCEMENT',
        target: target || 'ALL',
        userId: userId || null
      }
    });
    await logAdminAction(req.user.id, 'SEND_NOTIFICATION', 'Notification', notification.id, `Sent ${target} notification`);
    res.json(notification);
  } catch (error) {
    console.error('Error sending notification:', error);
    res.status(500).json({ error: 'Server error sending notification' });
  }
};

const getNotifications = async (req, res) => {
  try {
    const notifications = await prisma.notification.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json(notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Server error fetching notifications' });
  }
};

module.exports = {
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
};
