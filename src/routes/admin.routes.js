const express = require('express');
const router = express.Router();
const { readTable, writeTable } = require('../utils/jsonDb');
const { Op } = require('sequelize');
const { authenticate, isAdmin } = require('../middleware/auth');
const { startOfDay, endOfDay, startOfWeek, endOfWeek, subDays } = require('date-fns');

// Apply authentication and admin middleware to all routes
router.use(authenticate);
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

// Implement root GET /api/admin to return dashboard summary
router.get('/', async (req, res) => {
    try {
        // Read all bookings and showtimes
        const bookings = readTable('Bookings');
        const showtimes = readTable('Showtimes');
        const movies = readTable('Movies');
        const bookingSeats = readTable('BookingSeats');

        // All-time stats
        const totalTickets = bookingSeats.length;
        const totalRevenue = bookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
        const activeMovies = movies.length;

        // Filter bookings for the last 7 days for the pie chart
        const oneWeekAgo = subDays(new Date(), 7);
        const weeklyBookings = bookings.filter(b => new Date(b.bookingDate) >= oneWeekAgo);

        // Film distribution (tickets sold per movie for the last week)
        const movieTicketMap = {};
        weeklyBookings.forEach(b => {
            const showtime = showtimes.find(s => s.showtimeId === b.showtimeId);
            if (!showtime) return;
            const movie = movies.find(m => m.movieId === showtime.movieId);
            if (!movie) return;
            if (!movieTicketMap[movie.title]) movieTicketMap[movie.title] = 0;
            const ticketsForBooking = bookingSeats.filter(bs => bs.bookingId === b.bookingId).length;
            movieTicketMap[movie.title] += ticketsForBooking;
        });

        const totalTicketsAll = Object.values(movieTicketMap).reduce((a, b) => a + b, 0) || 1;
        const filmDistribution = Object.entries(movieTicketMap).map(([movieTitle, ticketsSold]) => ({
            movieTitle,
            ticketsSold,
            percentage: (ticketsSold / totalTicketsAll) * 100
        }));

        // Sales trend (last 7 days)
        const today = new Date();
        const salesTrend = [];
        for (let i = 6; i >= 0; i--) {
            const day = new Date(today);
            day.setDate(today.getDate() - i);
            const dayStart = new Date(day.getFullYear(), day.getMonth(), day.getDate(), 0, 0, 0, 0);
            const dayEnd = new Date(day.getFullYear(), day.getMonth(), day.getDate(), 23, 59, 59, 999);
            const dayBookings = bookings.filter(b => {
                const bookingDate = new Date(b.bookingDate);
                return bookingDate >= dayStart && bookingDate <= dayEnd;
            });
            salesTrend.push({
                date: dayStart.toISOString().slice(0, 10),
                ticketsSold: dayBookings.length,
                revenue: dayBookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0)
            });
        }

        // Recent bookings (last 5)
        const recentBookings = bookings
            .sort((a, b) => new Date(b.bookingDate) - new Date(a.bookingDate))
            .slice(0, 5)
            .map(b => {
                const showtime = showtimes.find(s => s.showtimeId === b.showtimeId);
                const movie = showtime ? movies.find(m => m.movieId === showtime.movieId) : null;
                const seats = bookingSeats
                    .filter(bs => bs.bookingId === b.bookingId)
                    .map(bs => bs.seatNumber)
                    .join(', ');
                return {
                    bookingId: b.bookingId,
                    movieTitle: movie ? movie.title : 'Unknown',
                    showtime: showtime ? showtime.showDateTime : '',
                    seats,
                    amount: b.totalAmount,
                    status: b.status
                };
            });

        res.json({
            allTimeStats: {
                totalTickets,
                totalRevenue,
                activeMovies
            },
            filmDistribution,
            salesTrend,
            recentBookings
        });
    } catch (error) {
        console.error('Error fetching dashboard data:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to fetch dashboard data'
        });
    }
});

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

// Get weekly sales history (file-based)
router.get('/sales/weeks', async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const allBookings = readTable('Bookings');
        
        const filteredBookings = (startDate && endDate)
            ? allBookings.filter(b => {
                const bookingDate = new Date(b.bookingDate);
                const start = new Date(startDate);
                start.setHours(0,0,0,0);
                const end = new Date(endDate);
                end.setHours(23,59,59,999);
                return bookingDate >= start && bookingDate <= end;
            })
            : allBookings;

        const totalSales = filteredBookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
        const bookingSeats = readTable('BookingSeats');
        const filteredBookingIds = new Set(filteredBookings.map(b => b.bookingId));
        const totalTickets = bookingSeats.filter(bs => filteredBookingIds.has(bs.bookingId)).length;


        if (!filteredBookings.length) {
            return res.json({ dailyData: [], totalSales: 0, totalTickets: 0 });
        }

        // Group bookings by day
        const daysMap = {};
        filteredBookings.forEach(b => {
            const dayKey = new Date(b.bookingDate).toISOString().slice(0, 10);

            if (!daysMap[dayKey]) {
                daysMap[dayKey] = { date: dayKey, totalSales: 0, bookingIds: new Set() };
            }
            daysMap[dayKey].totalSales += b.totalAmount || 0;
            daysMap[dayKey].bookingIds.add(b.bookingId);
        });

        const dailyData = Object.values(daysMap).map(d => {
            const ticketsInDay = bookingSeats.filter(bs => d.bookingIds.has(bs.bookingId)).length;
            return {
                date: d.date,
                totalSales: d.totalSales,
                totalTickets: ticketsInDay
            };
        }).sort((a, b) => new Date(a.date) - new Date(b.date));


        res.json({
            dailyData,
            totalSales,
            totalTickets,
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