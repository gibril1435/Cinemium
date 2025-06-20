const express = require('express');
const router = express.Router();
const { readTable, writeTable } = require('../utils/jsonDb');
const { isAdmin } = require('../middleware/auth');

/**
 * @swagger
 * tags:
 *   - name: TicketPrice
 *     description: Ticket price management (admin only)
 */

// Apply admin middleware to all routes
router.use(isAdmin);

// Get all ticket prices
router.get('/', (req, res) => {
  try {
    const ticketPrices = readTable('TicketPrices');
    res.json(ticketPrices);
  } catch (error) {
    console.error('Error fetching ticket prices:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch ticket prices'
    });
  }
});

// Get a ticket price by ID
router.get('/:id', (req, res) => {
  try {
    const ticketPrices = readTable('TicketPrices');
    const price = ticketPrices.find(p => p.id === req.params.id);
    
    if (!price) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Ticket price not found'
      });
    }
    
    res.json(price);
  } catch (error) {
    console.error('Error fetching ticket price:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch ticket price'
    });
  }
});

// Get current ticket price for a specific date
router.get('/current', (req, res) => {
  try {
    const { date } = req.query;
    const ticketPrices = readTable('TicketPrices');
    const targetDate = date ? new Date(date) : new Date();
    
    // Find the most applicable price for the given date
    let applicablePrice = null;
    
    for (const price of ticketPrices) {
      const startDate = price.startDate ? new Date(price.startDate) : null;
      const endDate = price.endDate ? new Date(price.endDate) : null;
      
      // Check if date falls within range
      if (startDate && endDate) {
        if (targetDate >= startDate && targetDate <= endDate) {
          applicablePrice = price;
          break;
        }
      } else if (startDate && !endDate) {
        if (targetDate >= startDate) {
          applicablePrice = price;
          break;
        }
      } else if (!startDate && !endDate) {
        // Default price
        applicablePrice = price;
        break;
      }
    }
    
    if (!applicablePrice) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'No price found for the specified date'
      });
    }
    
    res.json({ price: applicablePrice });
  } catch (error) {
    console.error('Error getting current price:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to get current price'
    });
  }
});

/**
 * @swagger
 * /api/admin/prices/current:
 *   get:
 *     summary: Get current ticket price for a specific date
 *     tags: [TicketPrice]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *         description: Date to get the price for
 *     responses:
 *       200:
 *         description: Current ticket price
 *       404:
 *         description: No price found for the specified date
 *       500:
 *         description: Failed to get current price
 */

// Create a new ticket price
router.post('/', (req, res) => {
  try {
    const { price, startDate, endDate, dayOfWeek, isHoliday, description, type } = req.body;
    
    if (!price || isNaN(price) || price <= 0) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Valid price is required'
      });
    }
    
    const ticketPrices = readTable('TicketPrices');
    const newId = ticketPrices.length ? Math.max(...ticketPrices.map(p => p.id)) + 1 : 1;
    
    const newPrice = {
      id: newId,
      price: parseFloat(price),
      startDate: startDate || null,
      endDate: endDate || null,
      dayOfWeek: dayOfWeek || null,
      isHoliday: isHoliday || false,
      description: description || '',
      type: type || 'custom',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    ticketPrices.push(newPrice);
    writeTable('TicketPrices', ticketPrices);
    res.status(201).json(newPrice);
  } catch (error) {
    console.error('Error creating ticket price:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to create ticket price'
    });
  }
});

/**
 * @swagger
 * /api/admin/prices:
 *   post:
 *     summary: Create a new ticket price
 *     tags: [TicketPrice]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               price:
 *                 type: number
 *               startDate:
 *                 type: string
 *               endDate:
 *                 type: string
 *               dayOfWeek:
 *                 type: integer
 *               isHoliday:
 *                 type: boolean
 *               description:
 *                 type: string
 *               type:
 *                 type: string
 *     responses:
 *       201:
 *         description: Ticket price created
 *       400:
 *         description: Validation error
 *       500:
 *         description: Failed to create ticket price
 */

// Set default ticket price
router.post('/default', (req, res) => {
  try {
    const { price } = req.body;
    
    if (!price || isNaN(price) || price <= 0) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Valid price is required'
      });
    }
    
    const ticketPrices = readTable('TicketPrices');
    
    // Remove existing default prices
    const filteredPrices = ticketPrices.filter(p => p.type !== 'default');
    
    const newId = filteredPrices.length ? Math.max(...filteredPrices.map(p => p.id)) + 1 : 1;
    
    const defaultPrice = {
      id: newId,
      price: parseFloat(price),
      startDate: null,
      endDate: null,
      dayOfWeek: null,
      isHoliday: false,
      description: 'Default ticket price',
      type: 'default',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    filteredPrices.push(defaultPrice);
    writeTable('TicketPrices', filteredPrices);
    res.status(201).json(defaultPrice);
  } catch (error) {
    console.error('Error setting default price:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to set default price'
    });
  }
});

/**
 * @swagger
 * /api/admin/prices/default:
 *   post:
 *     summary: Set default ticket price
 *     tags: [TicketPrice]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               price:
 *                 type: number
 *     responses:
 *       201:
 *         description: Default price set
 *       400:
 *         description: Validation error
 *       500:
 *         description: Failed to set default price
 */

// Set custom ticket price
router.post('/custom', (req, res) => {
  try {
    const { price, startDate, endDate, dayOfWeek, isHoliday, description } = req.body;
    
    if (!price || isNaN(price) || price <= 0) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Valid price is required'
      });
    }
    
    const ticketPrices = readTable('TicketPrices');
    const newId = ticketPrices.length ? Math.max(...ticketPrices.map(p => p.id)) + 1 : 1;
    
    const customPrice = {
      id: newId,
      price: parseFloat(price),
      startDate: startDate || null,
      endDate: endDate || null,
      dayOfWeek: dayOfWeek || null,
      isHoliday: isHoliday || false,
      description: description || 'Custom ticket price',
      type: 'custom',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    ticketPrices.push(customPrice);
    writeTable('TicketPrices', ticketPrices);
    res.status(201).json(customPrice);
  } catch (error) {
    console.error('Error setting custom price:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to set custom price'
    });
  }
});

/**
 * @swagger
 * /api/admin/prices/custom:
 *   post:
 *     summary: Set custom ticket price
 *     tags: [TicketPrice]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               price:
 *                 type: number
 *               startDate:
 *                 type: string
 *               endDate:
 *                 type: string
 *               dayOfWeek:
 *                 type: integer
 *               isHoliday:
 *                 type: boolean
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Custom price set
 *       400:
 *         description: Validation error
 *       500:
 *         description: Failed to set custom price
 */

// Update a ticket price
router.put('/:id', (req, res) => {
  try {
    const ticketPrices = readTable('TicketPrices');
    const idx = ticketPrices.findIndex(p => p.id === req.params.id);
    
    if (idx === -1) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Ticket price not found'
      });
    }
    
    ticketPrices[idx] = {
      ...ticketPrices[idx],
      ...req.body,
      updatedAt: new Date().toISOString()
    };
    
    writeTable('TicketPrices', ticketPrices);
    res.json(ticketPrices[idx]);
  } catch (error) {
    console.error('Error updating ticket price:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to update ticket price'
    });
  }
});

// Delete a ticket price
router.delete('/:id', (req, res) => {
  try {
    let ticketPrices = readTable('TicketPrices');
    const idx = ticketPrices.findIndex(p => p.id === req.params.id);
    
    if (idx === -1) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Ticket price not found'
      });
    }
    
    const deleted = ticketPrices.splice(idx, 1)[0];
    writeTable('TicketPrices', ticketPrices);
    res.json({ message: 'Ticket price deleted successfully', deleted });
  } catch (error) {
    console.error('Error deleting ticket price:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to delete ticket price'
    });
  }
});

/**
 * @swagger
 * /api/admin/prices/{id}:
 *   delete:
 *     summary: Delete a ticket price
 *     tags: [TicketPrice]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Ticket price ID
 *     responses:
 *       200:
 *         description: Ticket price deleted
 *       404:
 *         description: Ticket price not found
 *       500:
 *         description: Failed to delete ticket price
 */

// Get price history
router.get('/history', (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Start date and end date are required'
      });
    }
    
    const ticketPrices = readTable('TicketPrices');
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    const prices = ticketPrices.filter(price => {
      const priceStart = price.startDate ? new Date(price.startDate) : null;
      const priceEnd = price.endDate ? new Date(price.endDate) : null;
      
      if (priceStart && priceEnd) {
        return priceStart <= end && priceEnd >= start;
      } else if (priceStart && !priceEnd) {
        return priceStart <= end;
      } else if (!priceStart && priceEnd) {
        return priceEnd >= start;
      }
      return true; // Default prices
    });
    
    res.json({ prices });
  } catch (error) {
    console.error('Error getting price history:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to get price history'
    });
  }
});

/**
 * @swagger
 * /api/admin/prices/history:
 *   get:
 *     summary: Get ticket price history
 *     tags: [TicketPrice]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *         description: Start date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *         description: End date
 *     responses:
 *       200:
 *         description: Price history
 *       400:
 *         description: Validation error
 *       500:
 *         description: Failed to get price history
 */

module.exports = router; 