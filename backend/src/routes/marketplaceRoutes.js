const express = require('express');
const router = express.Router();
const prisma = require('../utils/prisma');
const { protect } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleAuth');

// Apply auth middleware to all marketplace routes
router.use(protect);
router.use(requireRole('ADMIN'));

// ==========================================
// PROVIDERS
// ==========================================
router.get('/providers', async (req, res) => {
  try {
    const providers = await prisma.aIProvider.findMany({
      include: {
        models: true,
        apiKeys: true
      }
    });
    res.json(providers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/providers', async (req, res) => {
  try {
    const provider = await prisma.aIProvider.create({ data: req.body });
    res.status(201).json(provider);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/providers/:id', async (req, res) => {
  try {
    const provider = await prisma.aIProvider.update({
      where: { id: req.params.id },
      data: req.body
    });
    res.json(provider);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/providers/:id', async (req, res) => {
  try {
    await prisma.aIProvider.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ==========================================
// MODELS
// ==========================================
router.get('/models', async (req, res) => {
  try {
    const models = await prisma.aIModel.findMany({
      include: { provider: true },
      orderBy: { priority: 'desc' }
    });
    res.json(models);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/models', async (req, res) => {
  try {
    const model = await prisma.aIModel.create({ data: req.body });
    res.status(201).json(model);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/models/:id', async (req, res) => {
  try {
    const model = await prisma.aIModel.update({
      where: { id: req.params.id },
      data: req.body
    });
    res.json(model);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/models/:id', async (req, res) => {
  try {
    await prisma.aIModel.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ==========================================
// API KEYS
// ==========================================
router.get('/keys', async (req, res) => {
  try {
    const keys = await prisma.providerAPIKey.findMany({
      include: { provider: true }
    });
    // Do not return raw keys if possible, but admin needs to see part of it or just manage it.
    // For now we send the keys since it's an admin panel, but in production we'd mask them.
    res.json(keys);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/keys', async (req, res) => {
  try {
    const key = await prisma.providerAPIKey.create({ data: req.body });
    res.status(201).json(key);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/keys/:id', async (req, res) => {
  try {
    const key = await prisma.providerAPIKey.update({
      where: { id: req.params.id },
      data: req.body
    });
    res.json(key);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/keys/:id', async (req, res) => {
  try {
    await prisma.providerAPIKey.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ==========================================
// ANALYTICS & HEALTH
// ==========================================
router.get('/analytics', async (req, res) => {
  try {
    // Basic analytics for the dashboard
    const providers = await prisma.aIProvider.count();
    const activeModels = await prisma.aIModel.count({ where: { enabled: true } });
    
    // Sum tokens and calculate estimated costs from Message table
    // In a real app we'd aggregate tokens, but for now we mock based on DB
    const keys = await prisma.providerAPIKey.findMany();
    const totalRequests = keys.reduce((acc, key) => acc + key.usageCount, 0);
    const todayRequests = keys.reduce((acc, key) => acc + key.requestsToday, 0);

    const providerHealth = await prisma.aIProvider.findMany({
      select: { providerName: true, status: true, enabled: true }
    });

    res.json({
      totalProviders: providers,
      activeModels,
      totalRequests,
      todayRequests,
      providerHealth
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
