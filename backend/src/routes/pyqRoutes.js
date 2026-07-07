const express = require('express');
const router = express.Router();
const pyqController = require('../controllers/pyqController');
const { protect } = require('../middleware/auth');
const multer = require('multer');

// Configure multer for file uploads in memory
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// All routes are protected by default authentication
router.use(protect);

// PYQ Library endpoints
router.get('/debug-db', (req, res) => res.json({ db: process.env.DATABASE_URL }));
router.post('/upload', upload.single('file'), pyqController.uploadPYQ);
router.get('/library', pyqController.getPYQLibrary);
router.delete('/library/:id', pyqController.deletePYQ);

// Current Paper Analyzer endpoints (Should be restricted to teachers, but using basic protect for now)
router.post('/analyze', upload.single('file'), pyqController.analyzeCurrentPaper);
router.post('/replace', pyqController.replaceQuestion);
router.post('/generate-pdf', pyqController.generatePDF);

module.exports = router;
