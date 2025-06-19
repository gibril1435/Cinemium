const express = require('express');
const router = express.Router();
const { readTable, writeTable } = require('../utils/jsonDb');
const { Op } = require('sequelize');
const { isAdmin } = require('../middleware/auth');
const { startOfDay, endOfDay, startOfWeek, endOfWeek } = require('date-fns');

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
});

// Get weekly sales history
router.get('/sales/weeks', async (req, res) => {
    try {
        const weeks = await Transaction.findAll({
            attributes: [
                [sequelize.fn('DATE_TRUNC', 'week', sequelize.col('transactionDate')), 'weekStart'],
                [sequelize.fn('COUNT', sequelize.col('id')), 'totalTickets'],
                [sequelize.fn('SUM', sequelize.col('totalAmount')), 'totalSales']
            ],
            group: [sequelize.fn('DATE_TRUNC', 'week', sequelize.col('transactionDate'))],
            order: [[sequelize.fn('DATE_TRUNC', 'week', sequelize.col('transactionDate')), 'DESC']]
        });

        res.json({
            weeks: weeks.map(week => ({
                weekStart: week.weekStart,
                weekEnd: new Date(week.weekStart.getTime() + 6 * 24 * 60 * 60 * 1000),
                totalSales: week.totalSales,
                totalTickets: week.totalTickets
            }))
        });
    } catch (error) {
        console.error('Error fetching weekly sales:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to fetch weekly sales'
        });
    }
});

// Get weekly sales details
router.get('/sales/weeks/:weekId', async (req, res) => {
    try {
        const { movie, addOn, showtime, user, date } = req.query;
        const weekStart = new Date(req.params.weekId);
        const weekEnd = new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000);

        const whereClause = {
            transactionDate: {
                [Op.between]: [weekStart, weekEnd]
            }
        };

        // Apply filters
        if (movie) {
            whereClause['$Showtime.Movie.title$'] = movie;
        }
        if (showtime) {
            whereClause['$Showtime.showDateTime$'] = showtime;
        }
        if (user) {
            whereClause['$User.username$'] = user;
        }
        if (date) {
            whereClause.transactionDate = {
                [Op.between]: [startOfDay(new Date(date)), endOfDay(new Date(date))]
            };
        }

        const transactions = await Transaction.findAll({
            where: whereClause,
            include: [
                {
                    model: Showtime,
                    include: [{ model: Movie, attributes: ['title'] }]
                },
                {
                    model: Ticket,
                    attributes: ['seatNumber']
                },
                {
                    model: TransactionAddOn,
                    include: [{ model: AddOn, attributes: ['name'] }],
                    where: addOn ? { '$AddOn.name$': addOn } : {}
                },
                {
                    model: User,
                    attributes: ['username']
                }
            ]
        });

        res.json({
            weekStart,
            weekEnd,
            transactions: transactions.map(transaction => ({
                id: transaction.id,
                username: transaction.User.username,
                movieTitle: transaction.Showtime.Movie.title,
                showTime: transaction.Showtime.showDateTime,
                seats: transaction.Tickets.map(ticket => ticket.seatNumber),
                addOns: transaction.TransactionAddOns.map(ta => ({
                    name: ta.AddOn.name,
                    quantity: ta.quantity
                })),
                totalAmount: transaction.totalAmount,
                transactionDate: transaction.transactionDate
            }))
        });
    } catch (error) {
        console.error('Error fetching weekly sales details:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to fetch weekly sales details'
        });
    }
});

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

module.exports = router; 