const jwt = require('jsonwebtoken');

const optionalAuth = (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret_key');
      req.user = decoded;
    } catch (error) {
      console.error("Invalid token passed to optionalAuth:", error);
    }
  }
  
  next();
};

module.exports = { optionalAuth };
