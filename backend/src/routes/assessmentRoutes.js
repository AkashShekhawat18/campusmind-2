const express = require('express');
const router = express.Router();
const assessmentController = require('../controllers/assessmentController');
const { protect } = require('../middleware/auth');

// Ensure all routes are protected
router.use(protect);

router.post('/create', assessmentController.createAssessment);
router.get('/teacher', assessmentController.getTeacherAssessments);
router.get('/:id', assessmentController.getAssessmentById);
router.put('/:id/status', assessmentController.updateAssessmentStatus);
router.post('/chat/stream', assessmentController.chatStream);
router.post('/generate-quiz', assessmentController.generateQuiz);

module.exports = router;
