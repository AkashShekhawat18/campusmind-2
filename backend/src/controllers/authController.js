const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const prisma = require('../utils/prisma');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'secret', {
    expiresIn: '30d',
  });
};

const registerUser = async (req, res, next) => {
  const { name, email, password, role, college, branch, officialId } = req.body;

  try {
    const userExists = await prisma.user.findUnique({ where: { email } });
    if (userExists) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const userRole = role || 'STUDENT';

    let newUser;
    await prisma.$transaction(async (tx) => {
      newUser = await tx.user.create({
        data: {
          name,
          email,
          officialId,
          password: hashedPassword,
          role: userRole,
          status: userRole === 'ADMIN' ? 'ACTIVE' : 'PENDING'
        }
      });

      // Enforce Approval Workflow for non-admins
      if (userRole !== 'ADMIN') {
        await tx.approval.create({
          data: {
            entityType: userRole,
            entityId: newUser.id,
            status: 'PENDING',
            requestedBy: newUser.id,
            metadata: JSON.stringify({ college, branch })
          }
        });
      }
    });

    res.status(201).json({
      message: 'Your registration request has been submitted successfully and is awaiting administrator approval.',
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role
    });

  } catch (error) {
    next(error);
  }
};

const loginUser = async (req, res, next) => {
  const { email, password } = req.body;

  try {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || !user.password) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Status checks
    if (user.role !== 'ADMIN') {
      if (user.status === 'PENDING') {
        return res.status(403).json({ error: 'Your account is pending admin approval.' });
      }
      if (user.status === 'REJECTED') {
        return res.status(403).json({ error: 'Your account registration was rejected.' });
      }
      if (user.status === 'SUSPENDED') {
        return res.status(403).json({ error: 'Your account has been suspended.' });
      }
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() }
    });
    
    // Record login history
    await prisma.loginHistory.create({
      data: {
        userId: user.id,
        status: 'SUCCESS',
        ipAddress: req.ip || null,
        userAgent: req.get('User-Agent') || null
      }
    });

    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      officialId: user.officialId,
      role: user.role,
      token: generateToken(user.id)
    });
  } catch (error) {
    next(error);
  }
};

const googleLogin = async (req, res, next) => {
  const { idToken, role, college, branch, officialId } = req.body;

  try {
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    
    if (!payload || !payload.email) {
      return res.status(400).json({ error: 'Invalid Google token' });
    }

    let user = await prisma.user.findUnique({ where: { email: payload.email } });

    if (!user) {
      // Register new user via Google
      const userRole = role || 'STUDENT';
      
      await prisma.$transaction(async (tx) => {
        user = await tx.user.create({
          data: {
            googleId: payload.sub,
            name: payload.name,
            email: payload.email,
            officialId,
            role: userRole,
            status: userRole === 'ADMIN' ? 'ACTIVE' : 'PENDING'
          }
        });

        if (userRole !== 'ADMIN') {
          await tx.approval.create({
            data: {
              entityType: userRole,
              entityId: user.id,
              status: 'PENDING',
              requestedBy: user.id,
              metadata: JSON.stringify({ college, branch, source: 'Google' })
            }
          });
        }
      });
      
      if (user.status === 'PENDING') {
        return res.status(201).json({
          message: 'Your registration request has been submitted successfully and is awaiting administrator approval.'
        });
      }
    } else {
      // Link Google ID if not already linked
      if (!user.googleId) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { googleId: payload.sub }
        });
      }
    }

    // Status checks
    if (user.role !== 'ADMIN') {
      if (user.status === 'PENDING') {
        return res.status(403).json({ error: 'Your account is pending admin approval.' });
      }
      if (user.status === 'REJECTED') {
        return res.status(403).json({ error: 'Your account registration was rejected.' });
      }
      if (user.status === 'SUSPENDED') {
        return res.status(403).json({ error: 'Your account has been suspended.' });
      }
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() }
    });
    
    await prisma.loginHistory.create({
      data: {
        userId: user.id,
        status: 'SUCCESS',
        ipAddress: req.ip || null,
        userAgent: req.get('User-Agent') || null
      }
    });

    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      officialId: user.officialId,
      role: user.role,
      token: generateToken(user.id)
    });

  } catch (error) {
    next(error);
  }
};

const changePasswordFirstLogin = async (req, res, next) => {
    return res.status(400).json({ error: 'Not implemented' });
};

const getMe = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, name: true, email: true, role: true }
    });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  registerUser,
  loginUser,
  googleLogin,
  getMe,
  changePasswordFirstLogin
};
