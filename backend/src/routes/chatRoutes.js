const express = require('express');
const { handleChat, getChats } = require('../controllers/chatController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.post('/', protect, handleChat);
router.get('/history', protect, getChats);

module.exports = router;
