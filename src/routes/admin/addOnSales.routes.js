const express = require('express');
const router = express.Router();
const { readTable, writeTable } = require('../../utils/jsonDb');

// Get all add-on sales
router.get('/', (req, res) => {
  const addOnSales = readTable('AddOnSales');
  res.json(addOnSales);
});

// Get an add-on sale by ID
router.get('/:id', (req, res) => {
  const addOnSales = readTable('AddOnSales');
  const sale = addOnSales.find(s => s.AddOnSaleID == req.params.id);
  if (!sale) return res.status(404).json({ error: 'AddOnSale not found' });
  res.json(sale);
});

// Create a new add-on sale
router.post('/', (req, res) => {
  const addOnSales = readTable('AddOnSales');
  const newId = addOnSales.length ? Math.max(...addOnSales.map(s => s.AddOnSaleID)) + 1 : 1;
  const newSale = { ...req.body, AddOnSaleID: newId };
  addOnSales.push(newSale);
  writeTable('AddOnSales', addOnSales);
  res.status(201).json(newSale);
});

// Update an add-on sale
router.put('/:id', (req, res) => {
  const addOnSales = readTable('AddOnSales');
  const idx = addOnSales.findIndex(s => s.AddOnSaleID == req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'AddOnSale not found' });
  addOnSales[idx] = { ...addOnSales[idx], ...req.body };
  writeTable('AddOnSales', addOnSales);
  res.json(addOnSales[idx]);
});

// Delete an add-on sale
router.delete('/:id', (req, res) => {
  let addOnSales = readTable('AddOnSales');
  const idx = addOnSales.findIndex(s => s.AddOnSaleID == req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'AddOnSale not found' });
  const deleted = addOnSales.splice(idx, 1)[0];
  writeTable('AddOnSales', addOnSales);
  res.json(deleted);
});

module.exports = router; 