const express = require('express');
const router = express.Router();
const { readTable } = require('../../utils/jsonDb');

// Get all add-on sales
router.get('/', (req, res) => {
  const addOnSales = readTable('AddOnSales');
  res.json(addOnSales);
});

// Get add-on sales by addOnId
router.get('/addon/:addOnId', (req, res) => {
  const addOnSales = readTable('AddOnSales');
  const filtered = addOnSales.filter(sale => sale.addOnId == req.params.addOnId);
  res.json(filtered);
});

// Get add-on sales summary (total quantity and revenue per add-on)
router.get('/summary', (req, res) => {
  const addOnSales = readTable('AddOnSales');
  const summary = {};
  addOnSales.forEach(sale => {
    const id = sale.addOnId;
    if (!summary[id]) {
      summary[id] = { addOnId: id, totalQuantity: 0, totalRevenue: 0 };
    }
    summary[id].totalQuantity += sale.quantity || sale.Quantity || 0;
    summary[id].totalRevenue += sale.TotalPrice || (sale.unitPrice * sale.quantity) || 0;
  });
  res.json(Object.values(summary));
});

module.exports = router; 