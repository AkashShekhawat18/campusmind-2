const prisma = require('../utils/prisma');

const getModels = async (req, res) => {
  try {
    const models = await prisma.aIModel.findMany({
      where: { enabled: true },
      orderBy: [
        { category: 'asc' },
        { priority: 'desc' },
      ],
    });
    res.json(models);
  } catch (error) {
    console.error('Error fetching models:', error);
    res.status(500).json({ error: 'Failed to fetch AI models' });
  }
};

const getAllModelsAdmin = async (req, res) => {
  try {
    const models = await prisma.aIModel.findMany({
      orderBy: [
        { category: 'asc' },
        { priority: 'desc' },
      ],
    });
    res.json(models);
  } catch (error) {
    console.error('Error fetching admin models:', error);
    res.status(500).json({ error: 'Failed to fetch AI models' });
  }
};

const toggleModel = async (req, res) => {
  try {
    const { id } = req.params;
    const { enabled } = req.body;
    
    const updated = await prisma.aIModel.update({
      where: { id },
      data: { enabled }
    });
    
    res.json(updated);
  } catch (error) {
    console.error('Error toggling model:', error);
    res.status(500).json({ error: 'Failed to toggle AI model' });
  }
};

module.exports = {
  getModels,
  getAllModelsAdmin,
  toggleModel
};
