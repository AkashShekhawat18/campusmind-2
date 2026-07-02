const express = require('express');
const { handleVoice } = require('../controllers/voiceController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.post('/', protect, handleVoice);

module.exports = router;
