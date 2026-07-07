const supabase = require('../utils/supabase');
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
    let data, error;
    let retries = 3;
    console.log('[protect] Validating token...');
    while (retries > 0) {
      try {
        const response = await supabase.auth.getUser(token);
        console.log('[protect] Validation response received.');
        data = response.data;
        error = response.error;
        break;
      } catch (err) {
        if ((err.code === 'ECONNRESET' || (err.cause && err.cause.code === 'ECONNRESET')) && retries > 1) {
          retries--;
          await new Promise(r => setTimeout(r, 500));
          continue;
        }
        throw err;
      }
    }
    
    if (error || !data?.user) {
        return res.status(401).json({ error: 'Not authorized, token failed' });
    }

    const decoded = data.user;
    
    // Fetch user to verify status (fallback to email for legacy users pre-migration)
    const user = await prisma.user.findFirst({ 
      where: { 
        OR: [
          { id: decoded.id },
          { email: decoded.email }
        ]
      }
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
