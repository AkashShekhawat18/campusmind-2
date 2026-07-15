const prisma = require('../utils/prisma');

const getModels = async (req, res) => {
  try {
    const models = await prisma.aIModel.findMany({
      where: { enabled: true },
      include: { provider: true },
      orderBy: [
        { priority: 'desc' },
      ],
    });

    const formattedModels = models.map(m => ({
      id: m.id,
      provider: m.provider.providerName,
      modelName: m.modelName,
      displayName: m.displayName,
      description: m.description,
      category: m.provider.providerName + ' Models',
      enabled: m.enabled,
      premium: m.premium,
      vision: m.supportsVision,
      reasoning: m.supportsReasoning,
      coding: m.supportsFunctionCalling,
      pdf: m.supportsPdf,
      math: m.supportsReasoning, // Map reasoning to math for UI
      status: 'ACTIVE'
    }));

    res.json(formattedModels);
  } catch (error) {
    console.error('Error fetching models:', error);
    res.status(500).json({ error: 'Failed to fetch AI models' });
  }
};

const getAllModelsAdmin = async (req, res) => {
  try {
    const models = await prisma.aIModel.findMany({
      include: { provider: true },
      orderBy: [
        { priority: 'desc' },
      ],
    });
    
    const formattedModels = models.map(m => ({
      id: m.id,
      provider: m.provider.providerName,
      modelName: m.modelName,
      displayName: m.displayName,
      description: m.description,
      category: m.provider.providerName + ' Models',
      enabled: m.enabled,
      premium: m.premium,
      vision: m.supportsVision,
      reasoning: m.supportsReasoning,
      coding: m.supportsFunctionCalling,
      pdf: m.supportsPdf,
      math: m.supportsReasoning, // Map reasoning to math for UI
      status: 'ACTIVE'
    }));
    
    res.json(formattedModels);
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
