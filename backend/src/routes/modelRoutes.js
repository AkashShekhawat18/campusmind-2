const express = require('express');
const router = express.Router();
const { getModels, getAllModelsAdmin, toggleModel } = require('../controllers/modelController');

// Public/Student routes
router.get('/', getModels);

// Admin routes (assuming admin middleware is applied at a higher level)
router.get('/admin', getAllModelsAdmin);
router.put('/:id/toggle', toggleModel);

module.exports = router;
