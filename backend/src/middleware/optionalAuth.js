const supabase = require('../utils/supabase');

const optionalAuth = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (token) {
    try {
      const { data, error } = await supabase.auth.getUser(token);
      if (!error && data.user) {
        req.user = data.user;
      }
    } catch (error) {
      console.error("Invalid token passed to optionalAuth:", error);
    }
  }
  
  next();
};

module.exports = { optionalAuth };
