const jwt = require('jsonwebtoken');
const prisma = require('../utils/prisma');

const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ error: 'Not authorized, no token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');

    const user = await prisma.user.findUnique({ 
      where: { id: decoded.id }
    });
    
    if (!user) {
      return res.status(401).json({ error: 'User not found in local database' });
    }

    if (user.status !== 'ACTIVE' && user.status !== 'PENDING') {
      return res.status(403).json({ error: 'Account is not active' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error(error);
    res.status(401).json({ error: 'Not authorized, token failed' });
  }
};

module.exports = { protect };
