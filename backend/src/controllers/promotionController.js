const { Promotion } = require('../models');
const { Op } = require('sequelize');

// Get all active promotions
exports.getActivePromotions = async (req, res) => {
  try {
    const promotions = await Promotion.findAll({
      where: {
        startDate: {
          [Op.lte]: new Date()
        },
        endDate: {
          [Op.gte]: new Date()
        },
        isActive: true
      }
    });
    res.json(promotions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get promotion by ID
exports.getPromotionById = async (req, res) => {
  try {
    const promotion = await Promotion.findByPk(req.params.id);
    if (!promotion) {
      return res.status(404).json({ error: 'Promotion not found' });
    }
    res.json(promotion);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Create new promotion (admin only)
exports.createPromotion = async (req, res) => {
  try {
    const promotion = await Promotion.create(req.body);
    res.status(201).json(promotion);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update promotion (admin only)
exports.updatePromotion = async (req, res) => {
  try {
    const promotion = await Promotion.findByPk(req.params.id);
    if (!promotion) {
      return res.status(404).json({ error: 'Promotion not found' });
    }
    await promotion.update(req.body);
    res.json(promotion);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete promotion (admin only)
exports.deletePromotion = async (req, res) => {
  try {
    const promotion = await Promotion.findByPk(req.params.id);
    if (!promotion) {
      return res.status(404).json({ error: 'Promotion not found' });
    }
    await promotion.destroy();
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get all promotions (admin only)
exports.getAllPromotions = async (req, res) => {
  try {
    const promotions = await Promotion.findAll();
    res.json(promotions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}; 