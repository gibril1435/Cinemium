const express = require('express');
const router = express.Router();
const { readTable, writeTable } = require('../utils/jsonDb');
const { authenticate } = require('../middleware/auth');
const QRCode = require('qrcode');
const { generateTicketPDF } = require('../utils/pdfGenerator');

/**
 * @swagger
 * /api/booking/showtimes/{showtimeId}/seats:
 *   get:
 *     summary: Get seat layout for a showtime
 *     tags:
 *       - Booking
 *     parameters:
 *       - in: path
 *         name: showtimeId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Showtime ID
 *     responses:
 *       200:
 *         description: Seat layout for the showtime
 *       404:
 *         description: Showtime not found
 *       500:
 *         description: Failed to fetch seat layout
 */

// Get seat layout for a showtime
router.get('/showtimes/:showtimeId/seats', (req, res) => {
  try {
    const showtimes = readTable('Showtimes');
    const showtime = showtimes.find(s => s.showtimeId == req.params.showtimeId);
    if (!showtime) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Showtime not found'
      });
    }
    // Create 8x5 seat layout
    const rows = ['A', 'B', 'C', 'D', 'E'];
    const columns = [1, 2, 3, 4, 5, 6, 7, 8];
    // Get reserved seats from BookingSeats (handle empty, missing, or invalid file)
    let bookingSeats = [];
    try {
      bookingSeats = readTable('BookingSeats');
      if (!Array.isArray(bookingSeats)) bookingSeats = [];
    } catch (e) {
      bookingSeats = [];
    }
    // Defensive: filter only valid objects with showtimeId and seatNumber
    const reservedSeats = new Set(
      bookingSeats && Array.isArray(bookingSeats)
        ? bookingSeats.filter(bs => bs && bs.showtimeId == req.params.showtimeId && bs.seatNumber)
            .map(bs => bs.seatNumber)
        : []
    );
    const seats = [];
    for (const row of rows) {
      for (const col of columns) {
        const seatId = `${row}${col}`;
        seats.push({
          id: seatId,
          label: seatId,
          available: !reservedSeats.has(seatId)
        });
      }
    }
    const movies = readTable('Movies');
    const movie = movies.find(m => m.movieId == showtime.movieId);
    res.json({
      showtimeId: showtime.showtimeId,
      movieTitle: movie ? movie.title : 'Unknown Movie',
      showTime: showtime.showDateTime,
      layout: { rows, columns, seats }
    });
  } catch (error) {
    console.error('Error fetching seat layout:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch seat layout'
    });
  }
});

/**
 * @swagger
 * /api/booking/transactions:
 *   post:
 *     summary: Process payment and create tickets
 *     tags:
 *       - Booking
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               showtimeId:
 *                 type: integer
 *               seats:
 *                 type: array
 *                 items:
 *                   type: string
 *               addOns:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     quantity:
 *                       type: integer
 *     responses:
 *       201:
 *         description: Transaction and tickets created
 *       400:
 *         description: Validation error
 *       404:
 *         description: Showtime not found
 *       500:
 *         description: Failed to process transaction
 */

// Process payment and create tickets
router.post('/transactions', authenticate, async (req, res) => {
  try {
    const { showtimeId, seats, addOns } = req.body;
    const userId = req.user.userId;
    const numericShowtimeId = parseInt(showtimeId, 10);
    
    // Validate seat count
    if (!seats || seats.length === 0 || seats.length > 4) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Must select between 1 and 4 seats'
      });
    }
    
    // Check if showtime exists
    const showtimes = readTable('Showtimes');
    const showtime = showtimes.find(s => s.showtimeId === numericShowtimeId);
    if (!showtime) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Showtime not found'
      });
    }
    
    // Check if seats are available
    const bookingSeats = readTable('BookingSeats');
    const reservedSeats = new Set(
      bookingSeats
        .filter(bs => bs.showtimeId === numericShowtimeId)
        .map(bs => bs.seatNumber)
    );
    
    const invalidSeats = seats.filter(seat => reservedSeats.has(seat));
    if (invalidSeats.length > 0) {
      return res.status(400).json({
        error: 'Validation Error',
        message: `Seats ${invalidSeats.join(', ')} are already reserved`
      });
    }
    
    // Calculate total amount and manage add-on stock
    let totalAmount = seats.length * showtime.price;
    const addOnItems = [];
    const allAddOns = readTable('AddOns');
    
    if (addOns && addOns.length > 0) {
      for (const addOn of addOns) {
        const addOnInDb = allAddOns.find(item => item.addOnId == addOn.id);
        if (addOnInDb) {
          if (addOnInDb.stock < addOn.quantity) {
            return res.status(400).json({
              error: 'Insufficient Stock',
              message: `Not enough stock for ${addOnInDb.name}. Only ${addOnInDb.stock} left.`
            });
          }
          totalAmount += addOnInDb.price * addOn.quantity;
          addOnItems.push({ ...addOnInDb, quantity: addOn.quantity });
        }
      }
    }
    
    // Create booking
    const bookings = readTable('Bookings');
    const newBookingId = bookings.length ? Math.max(...bookings.map(b => b.bookingId)) + 1 : 1;
    
    // Get studio name
    const studios = readTable('Studios');
    const studio = studios.find(s => s.studioId === showtime.studioId);

    const newBooking = {
      bookingId: newBookingId,
      userId: userId,
      showtimeId: numericShowtimeId,
      studioName: studio ? `Studio ${studio.studioNumber}` : 'N/A',
      totalAmount: totalAmount,
      bookingDate: new Date().toISOString(),
      status: 'confirmed'
    };
    
    bookings.push(newBooking);
    writeTable('Bookings', bookings);
    
    // Create booking seats
    let nextBookingSeatId = bookingSeats.length ? Math.max(...bookingSeats.map(bs => bs.bookingSeatId || 0)) + 1 : 1;
    const newBookingSeatsData = seats.map(seatNumber => ({
        bookingSeatId: nextBookingSeatId++,
        bookingId: newBookingId,
        showtimeId: numericShowtimeId,
        seatNumber: seatNumber
    }));
    
    bookingSeats.push(...newBookingSeatsData);
    writeTable('BookingSeats', bookingSeats);
    
    // Create add-on sales and update stock if any
    if (addOnItems.length > 0) {
      // Decrement stock from the in-memory array
      for (const item of addOnItems) {
        const addOnInDb = allAddOns.find(a => a.addOnId === item.addOnId);
        if (addOnInDb) {
          addOnInDb.stock -= item.quantity;
        }
      }
      
      const addOnSales = readTable('AddOnSales');
      let nextAddOnSaleId = addOnSales.length ? Math.max(...addOnSales.map(aos => aos.addOnSaleId || 0)) + 1 : 1;
      const newAddOnSales = addOnItems.map(addOn => {
        const sale = {
          addOnSaleId: nextAddOnSaleId,
          bookingId: newBookingId,
          addOnId: addOn.addOnId,
          quantity: addOn.quantity,
          unitPrice: addOn.price,
          TotalPrice: addOn.price * addOn.quantity
        };
        // For compatibility with existing data that might have PascalCase
        sale.AddOnSaleID = sale.addOnSaleId;
        sale.BookingID = sale.bookingId;
        sale.AddOnID = sale.addOnId;
        sale.Quantity = sale.quantity;
        sale.UnitPrice = sale.unitPrice;
        nextAddOnSaleId++;
        return sale;
      });
      
      addOnSales.push(...newAddOnSales);
      writeTable('AddOnSales', addOnSales);
      writeTable('AddOns', allAddOns); // Write updated stock
    }
    
    // Generate QR codes for tickets
    const tickets = await Promise.all(seats.map(async (seatNumber) => {
      const movies = readTable('Movies');
      const movie = movies.find(m => m.movieId == showtime.movieId);
      
      const qrCode = await QRCode.toDataURL(JSON.stringify({
        bookingId: newBookingId,
        seatNumber,
        showtimeId: numericShowtimeId,
        movieTitle: movie ? movie.title : 'Unknown Movie',
        showTime: showtime.showDateTime
      }));
      
      return {
        seatNumber,
        qrCode,
        movieTitle: movie ? movie.title : 'Unknown Movie',
        showTime: showtime.showDateTime
      };
    }));
    
    res.status(201).json({
      booking: newBooking,
      tickets,
      addOns: addOnItems,
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

/**
 * @swagger
 * /api/booking/users/history:
 *   get:
 *     summary: Get user's booking history
 *     tags: [Booking]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Booking history
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 history:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       date:
 *                         type: string
 *                       transactions:
 *                         type: array
 *                         items:
 *                           $ref: '#/components/schemas/Booking'
 *       401:
 *         description: Unauthorized
 */

// Get user's booking history
router.get('/history', authenticate, (req, res) => {
  try {
    const userId = req.user.userId;
    
    // Validate userId from JWT
    if (!userId) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid user token'
      });
    }
    
    const bookings = readTable('Bookings');
    const showtimes = readTable('Showtimes');
    const movies = readTable('Movies');
    const bookingSeats = readTable('BookingSeats');
    const addOnSales = readTable('AddOnSales');
    const addOns = readTable('AddOns');
    
    // Strict equality comparison and ensure userId exists in booking
    const userBookings = bookings
      .filter(b => b.userId && b.userId === userId)
      .map(booking => {
        const showtime = showtimes.find(s => s.showtimeId == booking.showtimeId);
        const movie = movies.find(m => m.movieId == showtime?.movieId);
        const seats = bookingSeats
          .filter(bs => bs.bookingId == booking.bookingId)
          .map(bs => bs.seatNumber);
        const bookingAddOns = addOnSales
          .filter(aos => aos.bookingId == booking.bookingId)
          .map(aos => {
            const addOn = addOns.find(a => a.addOnId == aos.addOnId);
            return {
              name: addOn ? addOn.name : 'Unknown Add-on',
              quantity: aos.quantity,
              unitPrice: aos.unitPrice,
              totalPrice: aos.totalPrice
            };
          });
        // Map to frontend expected fields
        return {
          id: booking.bookingId,
          date: booking.bookingDate,
          movieTitle: movie ? movie.title : '',
          posterUrl: movie ? movie.posterUrl : '',
          showtime: showtime ? showtime.showDateTime : '',
          seat: seats.join(', '),
          amount: booking.totalAmount,
          status: booking.status,
          addOns: bookingAddOns
        };
      })
      .sort((a, b) => new Date(b.date) - new Date(a.date));
    
    res.json(userBookings);
  } catch (error) {
    console.error('Error fetching booking history:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch booking history'
    });
  }
});

// Get booking details by ID
router.get('/:bookingId', authenticate, (req, res) => {
  try {
    const userId = req.user.userId;
    
    // Validate userId from JWT
    if (!userId) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid user token'
      });
    }
    
    const bookings = readTable('Bookings');
    const booking = bookings.find(b => b.bookingId == req.params.bookingId && b.userId && b.userId === userId);
    
    if (!booking) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Booking not found'
      });
    }
    
    const showtimes = readTable('Showtimes');
    const movies = readTable('Movies');
    const bookingSeats = readTable('BookingSeats');
    const addOnSales = readTable('AddOnSales');
    const addOns = readTable('AddOns');
    
    const showtime = showtimes.find(s => s.showtimeId == booking.showtimeId);
    const movie = movies.find(m => m.movieId == showtime?.movieId);
    const studio = readTable('Studios').find(s => s.studioId == showtime?.studioId);
    const seats = bookingSeats
      .filter(bs => bs.bookingId == booking.bookingId)
      .map(bs => bs.seatNumber);
    const bookingAddOns = addOnSales
      .filter(aos => aos.bookingId == booking.bookingId)
      .map(aos => {
        const addOn = addOns.find(a => a.addOnId == aos.addOnId);
        return {
          name: addOn ? addOn.name : 'Unknown Add-on',
          quantity: aos.quantity,
          unitPrice: aos.unitPrice,
          totalPrice: aos.totalPrice
        };
      });
    
    const bookingDetails = {
      ...booking,
      showtime: showtime ? {
        showDateTime: showtime.showDateTime,
        price: showtime.price,
        studioName: studio ? `Studio ${studio.studioNumber}` : 'N/A'
      } : null,
      movie: movie ? {
        title: movie.title,
        duration: movie.duration
      } : null,
      seats,
      addOns: bookingAddOns
    };
    
    res.json(bookingDetails);
  } catch (error) {
    console.error('Error fetching booking details:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch booking details'
    });
  }
});

// Cancel booking
router.delete('/:bookingId', authenticate, (req, res) => {
  try {
    const userId = req.user.userId;
    
    // Validate userId from JWT
    if (!userId) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid user token'
      });
    }
    
    let bookings = readTable('Bookings');
    const booking = bookings.find(b => b.bookingId == req.params.bookingId && b.userId && b.userId === userId);
    
    if (!booking) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Booking not found'
      });
    }
    
    // Check if booking can be cancelled (e.g., not within 2 hours of showtime)
    const showtimes = readTable('Showtimes');
    const showtime = showtimes.find(s => s.showtimeId == booking.showtimeId);
    if (showtime) {
      const showtimeDate = new Date(showtime.showDateTime);
      const now = new Date();
      const hoursUntilShowtime = (showtimeDate - now) / (1000 * 60 * 60);
      
      if (hoursUntilShowtime < 2) {
        return res.status(400).json({
          error: 'Validation Error',
          message: 'Cannot cancel booking within 2 hours of showtime'
        });
      }
    }
    
    // Update booking status
    const bookingIndex = bookings.findIndex(b => b.bookingId == req.params.bookingId);
    bookings[bookingIndex].status = 'cancelled';
    writeTable('Bookings', bookings);
    
    // Remove booking seats
    let bookingSeats = readTable('BookingSeats');
    bookingSeats = bookingSeats.filter(bs => bs.bookingId != req.params.bookingId);
    writeTable('BookingSeats', bookingSeats);
    
    // Remove add-on sales
    let addOnSales = readTable('AddOnSales');
    addOnSales = addOnSales.filter(aos => aos.bookingId != req.params.bookingId);
    writeTable('AddOnSales', addOnSales);
    
    res.json({
      message: 'Booking cancelled successfully',
      booking: bookings[bookingIndex]
    });
  } catch (error) {
    console.error('Error cancelling booking:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to cancel booking'
    });
  }
});

// Generate ticket PDF
router.get('/:bookingId/ticket', authenticate, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    // Validate userId from JWT
    if (!userId) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid user token'
      });
    }
    
    const bookings = readTable('Bookings');
    const booking = bookings.find(b => b.bookingId == req.params.bookingId && b.userId && b.userId === userId);
    
    if (!booking) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Booking not found'
      });
    }
    
    const showtimes = readTable('Showtimes');
    const movies = readTable('Movies');
    const bookingSeats = readTable('BookingSeats');
    const users = readTable('Users');
    const studios = readTable('Studios');
    
    const showtime = showtimes.find(s => s.showtimeId == booking.showtimeId);
    const movie = movies.find(m => m.movieId == showtime?.movieId);
    const user = users.find(u => u.userId == userId);
    const studio = studios.find(s => s.studioId == showtime?.studioId);
    const seats = bookingSeats
      .filter(bs => bs.bookingId == booking.bookingId)
      .map(bs => bs.seatNumber);

    // Generate QR code
    const qrCode = await QRCode.toDataURL(JSON.stringify({
      bookingId: booking.bookingId,
      seats: seats.join(', '),
      showtime: showtime?.showDateTime,
      studio: booking.studioName || 'N/A'
    }));
    
    const ticketData = {
      bookingId: booking.bookingId,
      movieTitle: movie ? movie.title : 'Unknown Movie',
      showTime: showtime ? showtime.showDateTime : 'Unknown Time',
      seats: seats.join(', '),
      studioName: studio ? `Studio ${studio.studioNumber}` : 'N/A',
      totalAmount: booking.totalAmount,
      qrCode
    };
    
    const pdfBuffer = await generateTicketPDF(ticketData);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=ticket-${booking.bookingId}.pdf`);
    res.setHeader('Content-Length', pdfBuffer.length);
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Error generating ticket PDF:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to generate ticket PDF'
    });
  }
});

// Public: Get showtime details by ID
router.get('/showtimes/:showtimeId', (req, res) => {
  const showtimes = readTable('Showtimes');
  const showtime = showtimes.find(s => s.showtimeId == req.params.showtimeId);
  if (!showtime) {
    return res.status(404).json({ message: 'Not Found' });
  }
  res.json(showtime);
});

module.exports = router; 