const express = require('express');
const { registerUser, loginUser, getMe, changePasswordFirstLogin } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/me', protect, getMe);
router.post('/change-password-first-login', protect, changePasswordFirstLogin);

module.exports = router;
