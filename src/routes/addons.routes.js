const express = require('express');
const router = express.Router();
const { isAdmin } = require('../middleware/auth');
const { Op } = require('sequelize');
const { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } = require('date-fns');
const { readTable, writeTable } = require('../utils/jsonDb');

// Public: Get all add-ons
router.get('/', (req, res) => {
  const addons = readTable('AddOns');
  res.json(addons);
});

// Apply admin middleware to all routes below
router.use(isAdmin);

/**
 * @swagger
 * tags:
 *   - name: AddOns
 *     description: Add-on management (admin only)
 * /api/admin/addons:
 *   get:
 *     summary: Get all add-ons
 *     tags: [AddOns]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of add-ons
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/AddOn'
 *       401:
 *         description: Unauthorized
 */

// Get an add-on by ID
router.get('/:id', (req, res) => {
  const addons = readTable('AddOns');
  const addon = addons.find(a => a.addOnId === req.params.id);
  if (!addon) return res.status(404).json({ error: 'AddOn not found' });
  res.json(addon);
});

// Create a new add-on
router.post('/', (req, res) => {
  const addons = readTable('AddOns');
  const newId = addons.length ? Math.max(...addons.map(a => a.addOnId)) + 1 : 1;
  const newAddon = { ...req.body, addOnId: newId };
  addons.push(newAddon);
  writeTable('AddOns', addons);
  res.status(201).json(newAddon);
});

// Update an add-on
router.put('/:id', (req, res) => {
  const addons = readTable('AddOns');
  const idx = addons.findIndex(a => a.addOnId === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'AddOn not found' });
  addons[idx] = { ...addons[idx], ...req.body };
  writeTable('AddOns', addons);
  res.json(addons[idx]);
});

// Delete an add-on
router.delete('/:id', (req, res) => {
  let addons = readTable('AddOns');
  const idx = addons.findIndex(a => a.addOnId === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'AddOn not found' });
  const deleted = addons.splice(idx, 1)[0];
  writeTable('AddOns', addons);
  res.json(deleted);
});

// Update add-on stock
router.patch('/:id/stock', async (req, res) => {
    try {
        const { stock } = req.body;
        
        if (stock === undefined) {
            return res.status(400).json({
                error: 'Validation Error',
                message: 'Stock value is required'
            });
        }

        const addOn = await AddOn.findByPk(req.params.id);
        
        if (!addOn) {
            return res.status(404).json({
                error: 'Not Found',
                message: 'Add-on not found'
            });
        }

        await addOn.update({ stock });
        res.json(addOn);
    } catch (error) {
        console.error('Error updating add-on stock:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to update add-on stock'
        });
    }
});

// Get add-on sales statistics
router.get('/:id/stats', async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const addOn = await AddOn.findByPk(req.params.id, {
            include: [{
                model: TransactionAddOn,
                where: startDate && endDate ? {
                    createdAt: {
                        [Op.between]: [new Date(startDate), new Date(endDate)]
                    }
                } : {},
                required: false
            }]
        });

        if (!addOn) {
            return res.status(404).json({
                error: 'Not Found',
                message: 'Add-on not found'
            });
        }

        const totalSold = addOn.TransactionAddOns.reduce((sum, ta) => sum + ta.quantity, 0);
        const totalRevenue = addOn.TransactionAddOns.reduce((sum, ta) => sum + (ta.quantity * addOn.price), 0);

        res.json({
            addOnId: addOn.id,
            addOnName: addOn.name,
            totalSold,
            totalRevenue,
            currentStock: addOn.stock,
            salesHistory: addOn.TransactionAddOns.map(ta => ({
                transactionId: ta.transactionId,
                quantity: ta.quantity,
                date: ta.createdAt
            }))
        });
    } catch (error) {
        console.error('Error fetching add-on statistics:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to fetch add-on statistics'
        });
    }
});

// Bulk create add-ons
router.post('/bulk', async (req, res) => {
    try {
        const { addOns } = req.body;

        if (!Array.isArray(addOns) || addOns.length === 0) {
            return res.status(400).json({
                error: 'Validation Error',
                message: 'Add-ons array is required'
            });
        }

        // Validate all add-ons
        for (const addOn of addOns) {
            if (!addOn.name || !addOn.price) {
                return res.status(400).json({
                    error: 'Validation Error',
                    message: 'Name and price are required for all add-ons'
                });
            }
        }

        // Check for duplicate names
        const names = addOns.map(addOn => addOn.name);
        const existingAddOns = await AddOn.findAll({
            where: { name: { [Op.in]: names } }
        });

        if (existingAddOns.length > 0) {
            return res.status(400).json({
                error: 'Validation Error',
                message: `Add-ons with these names already exist: ${existingAddOns.map(a => a.name).join(', ')}`
            });
        }

        // Create add-ons
        const createdAddOns = await AddOn.bulkCreate(addOns);
        res.status(201).json({ addOns: createdAddOns });
    } catch (error) {
        console.error('Error creating bulk add-ons:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to create add-ons'
        });
    }
});

// Bulk update add-ons
router.put('/bulk', async (req, res) => {
    try {
        const { addOns } = req.body;

        if (!Array.isArray(addOns) || addOns.length === 0) {
            return res.status(400).json({
                error: 'Validation Error',
                message: 'Add-ons array is required'
            });
        }

        // Validate all add-ons have IDs
        for (const addOn of addOns) {
            if (!addOn.id) {
                return res.status(400).json({
                    error: 'Validation Error',
                    message: 'ID is required for all add-ons'
                });
            }
        }

        // Update add-ons
        const results = await Promise.all(
            addOns.map(async (addOn) => {
                const existingAddOn = await AddOn.findByPk(addOn.id);
                if (!existingAddOn) {
                    return { id: addOn.id, error: 'Not found' };
                }

                // Check name uniqueness if name is being changed
                if (addOn.name && addOn.name !== existingAddOn.name) {
                    const duplicateAddOn = await AddOn.findOne({
                        where: { name: addOn.name }
                    });
                    if (duplicateAddOn) {
                        return { id: addOn.id, error: 'Name already exists' };
                    }
                }

                await existingAddOn.update(addOn);
                return { id: addOn.id, success: true, data: existingAddOn };
            })
        );

        res.json({ results });
    } catch (error) {
        console.error('Error updating bulk add-ons:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to update add-ons'
        });
    }
});

// Bulk delete add-ons
router.delete('/bulk', async (req, res) => {
    try {
        const { ids } = req.body;

        if (!Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({
                error: 'Validation Error',
                message: 'Add-on IDs array is required'
            });
        }

        const deletedCount = await AddOn.destroy({
            where: { id: { [Op.in]: ids } }
        });

        res.json({
            message: `Successfully deleted ${deletedCount} add-ons`,
            deletedCount
        });
    } catch (error) {
        console.error('Error deleting bulk add-ons:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to delete add-ons'
        });
    }
});

// Get enhanced sales analytics
router.get('/analytics', async (req, res) => {
    try {
        const { period = 'week' } = req.query;
        const now = new Date();
        let startDate, endDate;

        // Set date range based on period
        switch (period) {
            case 'day':
                startDate = startOfDay(now);
                endDate = endOfDay(now);
                break;
            case 'week':
                startDate = startOfWeek(now);
                endDate = endOfWeek(now);
                break;
            case 'month':
                startDate = startOfMonth(now);
                endDate = endOfMonth(now);
                break;
            default:
                return res.status(400).json({
                    error: 'Validation Error',
                    message: 'Invalid period. Use: day, week, or month'
                });
        }

        // Get sales data
        const salesData = await TransactionAddOn.findAll({
            where: {
                createdAt: {
                    [Op.between]: [startDate, endDate]
                }
            },
            include: [
                {
                    model: AddOn,
                    attributes: ['id', 'name', 'price']
                },
                {
                    model: Transaction,
                    attributes: ['transactionDate']
                }
            ]
        });

        // Process sales data
        const addOnStats = {};
        const hourlySales = {};
        const dailySales = {};

        salesData.forEach(sale => {
            const addOn = sale.AddOn;
            const transactionDate = sale.Transaction.transactionDate;
            const hour = transactionDate.getHours();
            const day = transactionDate.toISOString().split('T')[0];

            // Update add-on stats
            if (!addOnStats[addOn.id]) {
                addOnStats[addOn.id] = {
                    id: addOn.id,
                    name: addOn.name,
                    totalSold: 0,
                    totalRevenue: 0,
                    averagePrice: addOn.price
                };
            }
            addOnStats[addOn.id].totalSold += sale.quantity;
            addOnStats[addOn.id].totalRevenue += sale.quantity * addOn.price;

            // Update hourly sales
            if (!hourlySales[hour]) {
                hourlySales[hour] = {
                    hour,
                    totalSold: 0,
                    totalRevenue: 0
                };
            }
            hourlySales[hour].totalSold += sale.quantity;
            hourlySales[hour].totalRevenue += sale.quantity * addOn.price;

            // Update daily sales
            if (!dailySales[day]) {
                dailySales[day] = {
                    date: day,
                    totalSold: 0,
                    totalRevenue: 0
                };
            }
            dailySales[day].totalSold += sale.quantity;
            dailySales[day].totalRevenue += sale.quantity * addOn.price;
        });

        // Calculate overall statistics
        const totalSold = Object.values(addOnStats).reduce((sum, stat) => sum + stat.totalSold, 0);
        const totalRevenue = Object.values(addOnStats).reduce((sum, stat) => sum + stat.totalRevenue, 0);
        const averageOrderValue = totalSold > 0 ? totalRevenue / totalSold : 0;

        // Sort add-ons by revenue
        const topSellingAddOns = Object.values(addOnStats)
            .sort((a, b) => b.totalRevenue - a.totalRevenue)
            .slice(0, 5);

        res.json({
            period,
            dateRange: {
                start: startDate,
                end: endDate
            },
            summary: {
                totalSold,
                totalRevenue,
                averageOrderValue,
                uniqueAddOnsSold: Object.keys(addOnStats).length
            },
            topSellingAddOns,
            hourlyDistribution: Object.values(hourlySales).sort((a, b) => a.hour - b.hour),
            dailyTrend: Object.values(dailySales).sort((a, b) => a.date.localeCompare(b.date)),
            addOnDetails: Object.values(addOnStats)
        });
    } catch (error) {
        console.error('Error fetching sales analytics:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to fetch sales analytics'
        });
    }
});

module.exports = router; 