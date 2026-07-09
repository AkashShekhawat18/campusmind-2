const jwt = require('jsonwebtoken');
const prisma = require('../utils/prisma');

const optionalAuth = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
      const user = await prisma.user.findUnique({ 
        where: { id: decoded.id }
      });
      if (user) {
        req.user = user;
      }
    } catch (error) {
      console.error("Invalid token passed to optionalAuth:", error);
    }
  }
  
  next();
};

module.exports = { optionalAuth };
