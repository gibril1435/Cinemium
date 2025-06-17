const express = require('express');
const router = express.Router();
const { Showtime, Ticket, Transaction, TransactionAddOn, AddOn } = require('../models');
const { Op } = require('sequelize');
const { authenticate } = require('../middleware/auth');
const QRCode = require('qrcode');
const { generateTicketPDF } = require('../utils/pdfGenerator');
const fs = require('fs');

// Get seat layout for a showtime
router.get('/showtimes/:showtimeId/seats', async (req, res) => {
    try {
        const showtime = await Showtime.findByPk(req.params.showtimeId, {
            include: [{
                model: Ticket,
                attributes: ['seatNumber']
            }]
        });

        if (!showtime) {
            return res.status(404).json({
                error: 'Not Found',
                message: 'Showtime not found'
            });
        }

        // Create 8x5 seat layout
        const rows = ['A', 'B', 'C', 'D', 'E'];
        const columns = [1, 2, 3, 4, 5, 6, 7, 8];
        const reservedSeats = new Set(showtime.Tickets.map(ticket => ticket.seatNumber));

        const seats = [];
        for (const row of rows) {
            for (const col of columns) {
                const seatId = `${row}${col}`;
                seats.push({
                    id: seatId,
                    status: reservedSeats.has(seatId) ? 'reserved' : 'available'
                });
            }
        }

        res.json({
            showtimeId: showtime.id,
            movieTitle: showtime.Movie.title,
            showTime: showtime.showDateTime,
            layout: {
                rows,
                columns,
                seats
            }
        });
    } catch (error) {
        console.error('Error fetching seat layout:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to fetch seat layout'
        });
    }
});

// Process payment and create tickets
router.post('/transactions', authenticate, async (req, res) => {
    try {
        const { showtimeId, seats, addOns } = req.body;
        const userId = req.user.userId;

        // Validate seat count
        if (!seats || seats.length === 0 || seats.length > 4) {
            return res.status(400).json({
                error: 'Validation Error',
                message: 'Must select between 1 and 4 seats'
            });
        }

        // Check if seats are available
        const showtime = await Showtime.findByPk(showtimeId, {
            include: [{
                model: Ticket,
                attributes: ['seatNumber']
            }]
        });

        if (!showtime) {
            return res.status(404).json({
                error: 'Not Found',
                message: 'Showtime not found'
            });
        }

        const reservedSeats = new Set(showtime.Tickets.map(ticket => ticket.seatNumber));
        const invalidSeats = seats.filter(seat => reservedSeats.has(seat));
        if (invalidSeats.length > 0) {
            return res.status(400).json({
                error: 'Validation Error',
                message: `Seats ${invalidSeats.join(', ')} are already reserved`
            });
        }

        // Calculate total amount
        let totalAmount = seats.length * showtime.price;
        if (addOns && addOns.length > 0) {
            const addOnItems = await AddOn.findAll({
                where: {
                    id: {
                        [Op.in]: addOns.map(item => item.id)
                    }
                }
            });

            for (const addOn of addOns) {
                const addOnItem = addOnItems.find(item => item.id === addOn.id);
                if (addOnItem) {
                    totalAmount += addOnItem.price * addOn.quantity;
                }
            }
        }

        // Create transaction
        const transaction = await Transaction.create({
            userId,
            showtimeId,
            totalAmount
        });

        // Create tickets with QR codes
        const tickets = await Promise.all(seats.map(async (seatNumber) => {
            const qrCode = await QRCode.toDataURL(JSON.stringify({
                transactionId: transaction.id,
                seatNumber,
                showtimeId,
                movieTitle: showtime.Movie.title,
                showTime: showtime.showDateTime
            }));

            return Ticket.create({
                transactionId: transaction.id,
                seatNumber,
                qrCode
            });
        }));

        // Add add-ons to transaction
        if (addOns && addOns.length > 0) {
            await Promise.all(addOns.map(addOn =>
                TransactionAddOn.create({
                    transactionId: transaction.id,
                    addOnId: addOn.id,
                    quantity: addOn.quantity
                })
            ));
        }

        res.status(201).json({
            transactionId: transaction.id,
            tickets: tickets.map(ticket => ({
                seatNumber: ticket.seatNumber,
                qrCode: ticket.qrCode
            })),
            totalAmount
        });
    } catch (error) {
        console.error('Error processing transaction:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to process transaction'
        });
    }
});

// Get user's purchase history
router.get('/users/history', authenticate, async (req, res) => {
    try {
        const transactions = await Transaction.findAll({
            where: { userId: req.user.userId },
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
                    include: [{ model: AddOn, attributes: ['name'] }]
                }
            ],
            order: [['transactionDate', 'DESC']]
        });

        // Group transactions by date
        const history = transactions.reduce((acc, transaction) => {
            const date = transaction.transactionDate.toISOString().split('T')[0];
            if (!acc[date]) {
                acc[date] = [];
            }

            acc[date].push({
                id: transaction.id,
                movieTitle: transaction.Showtime.Movie.title,
                showTime: transaction.Showtime.showDateTime,
                seats: transaction.Tickets.map(ticket => ticket.seatNumber),
                totalAmount: transaction.totalAmount
            });

            return acc;
        }, {});

        res.json({
            history: Object.entries(history).map(([date, transactions]) => ({
                date,
                transactions
            }))
        });
    } catch (error) {
        console.error('Error fetching purchase history:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to fetch purchase history'
        });
    }
});

// Download ticket as PDF
router.get('/tickets/:ticketId/pdf', authenticate, async (req, res) => {
    try {
        const ticket = await Ticket.findByPk(req.params.ticketId, {
            include: [{
                model: Transaction,
                include: [{
                    model: Showtime,
                    include: [{ model: Movie, attributes: ['title'] }]
                }]
            }]
        });

        if (!ticket) {
            return res.status(404).json({
                error: 'Not Found',
                message: 'Ticket not found'
            });
        }

        // Verify ticket belongs to user
        if (ticket.Transaction.userId !== req.user.userId) {
            return res.status(403).json({
                error: 'Forbidden',
                message: 'You do not have permission to access this ticket'
            });
        }

        // Generate PDF
        const pdfPath = await generateTicketPDF({
            movieTitle: ticket.Transaction.Showtime.Movie.title,
            showTime: ticket.Transaction.Showtime.showDateTime,
            seatNumber: ticket.seatNumber,
            studio: ticket.Transaction.Showtime.studioId,
            qrCode: ticket.qrCode
        });

        // Send PDF file
        res.download(pdfPath, `ticket_${ticket.id}.pdf`, (err) => {
            if (err) {
                console.error('Error sending PDF:', err);
            }
            // Clean up temporary file
            fs.unlink(pdfPath, (unlinkErr) => {
                if (unlinkErr) {
                    console.error('Error deleting temporary PDF:', unlinkErr);
                }
            });
        });
    } catch (error) {
        console.error('Error generating PDF:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to generate PDF ticket'
        });
    }
});

module.exports = router; 