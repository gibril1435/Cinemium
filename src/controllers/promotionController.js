const { readTable, writeTable } = require('../utils/jsonDb');

// Get all active promotions
exports.getActivePromotions = (req, res) => {
  const promotions = readTable('Promotions');
  res.json(promotions);
};

// Get promotion by ID
exports.getPromotionById = (req, res) => {
  const promotions = readTable('Promotions');
  const promotion = promotions.find(p => p.PromotionID === parseInt(req.params.id));
  if (!promotion) {
    return res.status(404).json({ error: 'Promotion not found' });
  }
  res.json(promotion);
};

// Create new promotion (admin only)
exports.createPromotion = (req, res) => {
  const promotions = readTable('Promotions');
  const newId = promotions.length ? Math.max(...promotions.map(p => p.PromotionID)) + 1 : 1;
  const newPromo = { ...req.body, PromotionID: newId };
  promotions.push(newPromo);
  writeTable('Promotions', promotions);
  res.status(201).json(newPromo);
};

// Update promotion (admin only)
exports.updatePromotion = (req, res) => {
  const promotions = readTable('Promotions');
  const promotion = promotions.find(p => p.PromotionID === parseInt(req.params.id));
  if (!promotion) {
    return res.status(404).json({ error: 'Promotion not found' });
  }
  const updatedPromotion = { ...promotion, ...req.body };
  const index = promotions.findIndex(p => p.PromotionID === parseInt(req.params.id));
  promotions[index] = updatedPromotion;
  writeTable('Promotions', promotions);
  res.json(updatedPromotion);
};

// Delete promotion (admin only)
exports.deletePromotion = (req, res) => {
  const promotions = readTable('Promotions');
  const promotion = promotions.find(p => p.PromotionID === parseInt(req.params.id));
  if (!promotion) {
    return res.status(404).json({ error: 'Promotion not found' });
  }
  const filteredPromotions = promotions.filter(p => p.PromotionID !== parseInt(req.params.id));
  writeTable('Promotions', filteredPromotions);
  res.status(204).send();
};

// Get all promotions (admin only)
exports.getAllPromotions = (req, res) => {
  const promotions = readTable('Promotions');
  res.json(promotions);
}; 