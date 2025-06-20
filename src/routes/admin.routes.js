const express = require('express');
const router = express.Router();
const { readTable, writeTable } = require('../utils/jsonDb');
const { Op } = require('sequelize');
const { isAdmin } = require('../middleware/auth');
const { startOfDay, endOfDay, startOfWeek, endOfWeek } = require('date-fns');
const { getAllBookings } = require('./bookings.routes');

// Apply admin middleware to all routes
router.use(isAdmin);

/**
 * @swagger
 * tags:
 *   - name: Admin
 *     description: Admin operations (bookings, analytics, users, etc.)
 * /api/admin:
 *   get:
 *     summary: Admin dashboard root (protected)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Admin dashboard info
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /api/admin/dashboard:
 *   get:
 *     summary: Get admin dashboard summary
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard summary
 *       401:
 *         description: Unauthorized
 */

// Get dashboard summary
router.get('/dashboard', async (req, res) => {
    if (req.query.report === 'weeklySales') {
        // ... move /sales/weeks logic here ...
    } else {
        try {
            const today = new Date();
            const todayStart = startOfDay(today);
            const todayEnd = endOfDay(today);

            // Get today's stats
            const todayStats = await Transaction.findAll({
                where: {
                    transactionDate: {
                        [Op.between]: [todayStart, todayEnd]
                    }
                },
                attributes: [
                    [sequelize.fn('COUNT', sequelize.col('id')), 'totalTickets'],
                    [sequelize.fn('SUM', sequelize.col('totalAmount')), 'totalRevenue']
                ]
            });

            // Get film distribution
            const filmDistribution = await Transaction.findAll({
                include: [{
                    model: Showtime,
                    include: [{ model: Movie, attributes: ['title'] }]
                }],
                attributes: [
                    [sequelize.fn('COUNT', sequelize.col('id')), 'ticketsSold']
                ],
                group: ['Showtime.Movie.title']
            });

            // Calculate percentages
            const totalTickets = filmDistribution.reduce((sum, film) => sum + film.ticketsSold, 0);
            const distributionWithPercentages = filmDistribution.map(film => ({
                movieTitle: film.Showtime.Movie.title,
                ticketsSold: film.ticketsSold,
                percentage: (film.ticketsSold / totalTickets) * 100
            }));

            // Get sales trend (last 7 days)
            const salesTrend = await Transaction.findAll({
                where: {
                    transactionDate: {
                        [Op.gte]: new Date(today - 7 * 24 * 60 * 60 * 1000)
                    }
                },
                attributes: [
                    [sequelize.fn('DATE', sequelize.col('transactionDate')), 'date'],
                    [sequelize.fn('COUNT', sequelize.col('id')), 'ticketsSold'],
                    [sequelize.fn('SUM', sequelize.col('totalAmount')), 'revenue']
                ],
                group: [sequelize.fn('DATE', sequelize.col('transactionDate'))],
                order: [[sequelize.fn('DATE', sequelize.col('transactionDate')), 'ASC']]
            });

            res.json({
                todayStats: {
                    totalTickets: todayStats[0].totalTickets,
                    totalRevenue: todayStats[0].totalRevenue
                },
                filmDistribution: distributionWithPercentages,
                salesTrend: salesTrend.map(day => ({
                    date: day.date,
                    ticketsSold: day.ticketsSold,
                    revenue: day.revenue
                }))
            });
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
            res.status(500).json({
                error: 'Internal Server Error',
                message: 'Failed to fetch dashboard data'
            });
        }
    }
});

// Secure admin bookings endpoint
router.get('/bookings', isAdmin, getAllBookings);

// Set ticket price
router.post('/prices', async (req, res) => {
    try {
        const { isDefault, price, startDate, endDate } = req.body;

        if (!isDefault && (!startDate || !endDate)) {
            return res.status(400).json({
                error: 'Validation Error',
                message: 'Start date and end date are required for custom prices'
            });
        }

        const ticketPrice = await TicketPrice.create({
            isDefault,
            price,
            startDate: isDefault ? null : startDate,
            endDate: isDefault ? null : endDate
        });

        res.status(201).json(ticketPrice);
    } catch (error) {
        console.error('Error setting ticket price:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to set ticket price'
        });
    }
});

router.get('/sales/weeks', async (req, res) => {
  try {
    const bookings = readTable('Bookings');
    const now = new Date();
    const days = 7;
    const result = [];
    for (let i = days - 1; i >= 0; i--) {
      const day = new Date(now);
      day.setDate(now.getDate() - i);
      const dayStr = day.toISOString().slice(0, 10);
      const salesForDay = bookings.filter(b => b.status === 'confirmed' && b.bookingDate.slice(0, 10) === dayStr);
      result.push({
        date: dayStr,
        totalSales: salesForDay.length,
        totalRevenue: salesForDay.reduce((sum, b) => sum + (b.totalAmount || 0), 0)
      });
    }
    res.json({ days: result });
  } catch (error) {
    console.error('Error fetching weekly sales:', error);
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to fetch weekly sales' });
  }
});

module.exports = router; 