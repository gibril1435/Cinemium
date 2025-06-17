const express = require('express');
const router = express.Router();
const { isAdmin } = require('../middleware/auth');
const ticketPriceService = require('../services/ticketPrice.service');

// Apply admin middleware to all routes
router.use(isAdmin);

// Get current ticket price for a specific date
router.get('/current', async (req, res) => {
    try {
        const { date } = req.query;
        const price = await ticketPriceService.getPriceForDate(new Date(date));
        
        if (!price) {
            return res.status(404).json({
                error: 'Not Found',
                message: 'No price found for the specified date'
            });
        }

        res.json({ price });
    } catch (error) {
        console.error('Error getting current price:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to get current price'
        });
    }
});

// Set default ticket price
router.post('/default', async (req, res) => {
    try {
        const { price } = req.body;

        if (!price || isNaN(price) || price <= 0) {
            return res.status(400).json({
                error: 'Validation Error',
                message: 'Valid price is required'
            });
        }

        const defaultPrice = await ticketPriceService.setDefaultPrice(price);
        res.status(201).json(defaultPrice);
    } catch (error) {
        console.error('Error setting default price:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to set default price'
        });
    }
});

// Set custom ticket price
router.post('/custom', async (req, res) => {
    try {
        const { price, startDate, endDate, dayOfWeek, isHoliday, description } = req.body;

        if (!price || isNaN(price) || price <= 0) {
            return res.status(400).json({
                error: 'Validation Error',
                message: 'Valid price is required'
            });
        }

        const customPrice = await ticketPriceService.setCustomPrice({
            price,
            startDate,
            endDate,
            dayOfWeek,
            isHoliday,
            description
        });

        res.status(201).json(customPrice);
    } catch (error) {
        console.error('Error setting custom price:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to set custom price'
        });
    }
});

// Get price history
router.get('/history', async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        if (!startDate || !endDate) {
            return res.status(400).json({
                error: 'Validation Error',
                message: 'Start date and end date are required'
            });
        }

        const prices = await ticketPriceService.getPriceHistory(
            new Date(startDate),
            new Date(endDate)
        );

        res.json({ prices });
    } catch (error) {
        console.error('Error getting price history:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to get price history'
        });
    }
});

// Delete custom price
router.delete('/custom/:id', async (req, res) => {
    try {
        await ticketPriceService.deleteCustomPrice(req.params.id);
        res.json({ message: 'Custom price deleted successfully' });
    } catch (error) {
        console.error('Error deleting custom price:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to delete custom price'
        });
    }
});

module.exports = router; 