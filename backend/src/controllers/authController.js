const supabase = require('../utils/supabase');
const prisma = require('../utils/prisma');

const registerUser = async (req, res, next) => {
  const { name, email, password, role, college, branch, officialId } = req.body;

  try {
    const userExists = await prisma.user.findUnique({ where: { email } });
    if (userExists) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Register with Supabase
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) {
      return res.status(400).json({ error: authError.message });
    }

    const supabaseUserId = authData.user?.id;
    if (!supabaseUserId) {
        return res.status(400).json({ error: 'Could not create user in Supabase' });
    }

    const userRole = role || 'STUDENT';

    try {
      await prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            id: supabaseUserId,
            name,
            email,
            officialId,
            password: 'SUPABASE_MANAGED', // Password handled by Supabase
            role: userRole,
            status: userRole === 'ADMIN' ? 'ACTIVE' : 'PENDING'
          }
        });

        // Enforce Approval Workflow for non-admins
        if (userRole !== 'ADMIN') {
          await tx.approval.create({
            data: {
              entityType: userRole,
              entityId: user.id,
              status: 'PENDING',
              requestedBy: user.id,
              metadata: JSON.stringify({ college, branch })
            }
          });
        }
      });

      res.status(201).json({
        message: 'Your registration request has been submitted successfully and is awaiting administrator approval.',
        id: supabaseUserId,
        name,
        email,
        role: userRole
      });
    } catch (dbError) {
      // Rollback Supabase Auth user if Prisma transaction fails
      console.error('Database transaction failed, rolling back Supabase user:', dbError);
      await supabase.auth.admin.deleteUser(supabaseUserId);
      throw dbError; // Pass to the next(error) handler
    }

  } catch (error) {
    next(error);
  }
};

const loginUser = async (req, res, next) => {
  const { email, password } = req.body; // email field could be email or officialId, but Supabase requires email

  try {
    // Authenticate with Supabase
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      return res.status(401).json({ error: authError.message });
    }

    const user = await prisma.user.findUnique({
      where: { email: email }
    });

    if (!user) {
        return res.status(401).json({ error: 'User found in Supabase but not in local DB' });
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
      token: authData.session.access_token // Return Supabase JWT token
    });
  } catch (error) {
    next(error);
  }
};

const changePasswordFirstLogin = async (req, res, next) => {
    return res.status(400).json({ error: 'Not implemented for Supabase yet' });
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
  getMe,
  changePasswordFirstLogin
};
