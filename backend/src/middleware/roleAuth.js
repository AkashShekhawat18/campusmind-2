const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authorized' });
    }

    // We need to fetch the user's role from DB since JWT only has { id }
    const prisma = require('../utils/prisma');
    prisma.user.findUnique({
      where: { id: req.user.id },
      select: { role: true }
    }).then(user => {
      if (!user || !roles.includes(user.role)) {
        return res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
      }
      req.user.role = user.role;
      next();
    }).catch(err => {
      next(err);
    });
  };
};

module.exports = { requireRole };
