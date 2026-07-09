const prisma = require('../utils/prisma');
const bcrypt = require('bcryptjs');

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

const getStats = async (req, res, next) => {
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
    next(error);
  }
};

const getUsers = async (req, res, next) => {
  try {
    let limit = parseInt(req.query.limit) || 50;
    if (limit > 200) limit = 200; // Hard server-side cap
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * limit;

    const users = await prisma.user.findMany({
      take: limit,
      skip,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });
    // Note: Returning array directly to avoid breaking existing UI, 
    // but applying limit/skip ensures bounded results.
    res.json(users);
  } catch (error) {
    next(error);
  }
};

const updateUser = async (req, res, next) => {
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
    next(error);
  }
};

const deleteUser = async (req, res, next) => {
  const { id } = req.params;
  try {
    await prisma.user.delete({ where: { id } });
    await logAdminAction(req.user.id, 'DELETE_USER', 'User', id, 'Deleted user account');
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    next(error);
  }
};

const updateUserPassword = async (req, res, next) => {
  const { id } = req.params;
  const { password } = req.body;
  
  try {
    if (!password || password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    await prisma.user.update({
      where: { id },
      data: { password: hashedPassword }
    });

    await logAdminAction(req.user.id, 'UPDATE_PASSWORD', 'User', id, 'Admin manually reset user password');
    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    next(error);
  }
};

const getApprovals = async (req, res, next) => {
  try {
    let limit = parseInt(req.query.limit) || 50;
    if (limit > 200) limit = 200; // Hard server-side cap
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * limit;

    const approvals = await prisma.approval.findMany({
      take: limit,
      skip,
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
    next(error);
  }
};

const updateApproval = async (req, res, next) => {
  const { id } = req.params;
  const { status, reviewNotes } = req.body;
  try {
    const approval = await prisma.approval.findUnique({ where: { id } });
    if (!approval) return res.status(404).json({ error: 'Approval not found' });
    
    // Perform updates in a single transaction
    const [updatedApproval] = await prisma.$transaction([
      prisma.approval.update({
        where: { id },
        data: { 
          status, 
          remarks: reviewNotes, // map incoming 'reviewNotes' to 'remarks' field in DB
          reviewedBy: req.user.id,
          approvedBy: status === 'APPROVED' ? req.user.id : null,
          approvedAt: status === 'APPROVED' ? new Date() : null,
          rejectedBy: status === 'REJECTED' ? req.user.id : null,
          rejectedAt: status === 'REJECTED' ? new Date() : null,
        }
      }),
      // Only update User status to ACTIVE if APPROVED, else keep PENDING (or update to REJECTED)
      prisma.user.update({
        where: { id: approval.entityId },
        data: { 
          status: status === 'APPROVED' ? 'ACTIVE' : (status === 'REJECTED' ? 'REJECTED' : 'PENDING'),
          firstLogin: status === 'APPROVED' ? false : undefined 
        }
      })
    ]);

    await logAdminAction(req.user.id, 'UPDATE_APPROVAL', 'Approval', id, `Changed status to ${status}`);
    
    res.json(updatedApproval);
  } catch (error) {
    next(error);
  }
};

const suspendUser = async (req, res, next) => {
  const { id } = req.params;
  const { status } = req.body; // expect 'ACTIVE' or 'SUSPENDED'
  try {
    if (status !== 'ACTIVE' && status !== 'SUSPENDED') {
      return res.status(400).json({ error: 'Invalid status' });
    }
    const user = await prisma.user.update({
      where: { id },
      data: { status }
    });
    await logAdminAction(req.user.id, 'SUSPEND_USER', 'User', id, `Changed status to ${status}`);
    res.json(user);
  } catch (error) {
    next(error);
  }
};

const getGptHistory = async (req, res, next) => {
  try {
    let limit = parseInt(req.query.limit) || 50;
    if (limit > 200) limit = 200;
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * limit;

    const chats = await prisma.chat.findMany({
      take: limit,
      skip,
      include: {
        user: { select: { name: true, email: true, role: true } },
        messages: {
          orderBy: { createdAt: 'asc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(chats);
  } catch (error) {
    next(error);
  }
};

const getSettings = async (req, res, next) => {
  try {
    const settings = await prisma.systemSetting.findMany();
    // Convert array of {key, value} into an object { [key]: value }
    const settingsObj = {};
    settings.forEach(s => { settingsObj[s.key] = s.value; });
    res.json(settingsObj);
  } catch (error) {
    next(error);
  }
};

const updateSetting = async (req, res, next) => {
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
    next(error);
  }
};

const sendNotification = async (req, res, next) => {
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
    next(error);
  }
};

const getNotifications = async (req, res, next) => {
  try {
    let limit = parseInt(req.query.limit) || 50;
    if (limit > 200) limit = 200;
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * limit;

    const notifications = await prisma.notification.findMany({
      take: limit,
      skip,
      orderBy: { createdAt: 'desc' }
    });
    res.json(notifications);
  } catch (error) {
    next(error);
  }
};

module.exports = {
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
};
