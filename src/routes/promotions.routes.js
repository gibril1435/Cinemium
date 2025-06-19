const express = require('express');
const router = express.Router();
const { readTable, writeTable } = require('../utils/jsonDb');

// Get all promotions
router.get('/', (req, res) => {
  const promotions = readTable('Promotions');
  res.json(promotions);
});

// Get a promotion by ID
router.get('/:id', (req, res) => {
  const promotions = readTable('Promotions');
  const promo = promotions.find(p => p.PromotionID == req.params.id);
  if (!promo) return res.status(404).json({ error: 'Promotion not found' });
  res.json(promo);
});

// Create a new promotion
router.post('/', (req, res) => {
  const promotions = readTable('Promotions');
  const newId = promotions.length ? Math.max(...promotions.map(p => p.PromotionID || p.id || 0)) + 1 : 1;
  const newPromo = { ...req.body, PromotionID: newId };
  promotions.push(newPromo);
  writeTable('Promotions', promotions);
  res.status(201).json(newPromo);
});

// Update a promotion
router.put('/:id', (req, res) => {
  const promotions = readTable('Promotions');
  const idx = promotions.findIndex(p => p.PromotionID == req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Promotion not found' });
  promotions[idx] = { ...promotions[idx], ...req.body };
  writeTable('Promotions', promotions);
  res.json(promotions[idx]);
});

// Delete a promotion
router.delete('/:id', (req, res) => {
  let promotions = readTable('Promotions');
  const idx = promotions.findIndex(p => p.PromotionID == req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Promotion not found' });
  const deleted = promotions.splice(idx, 1)[0];
  writeTable('Promotions', promotions);
  res.json(deleted);
});

module.exports = router; 