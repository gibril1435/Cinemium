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
    const showtime = showtimes.find(s => s.showtimeId === req.params.showtimeId || s.showtimeId === Number(req.params.showtimeId));
    if (!showtime) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Showtime not found'
      });
    }
    const studios = readTable('Studios');
    const studio = studios.find(s => s.studioId === showtime.studioId || s.studioId === Number(showtime.studioId));
    if (!studio) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Studio not found for this showtime'
      });
    }
    const allSeats = readTable('Seats');
    const studioSeats = allSeats.filter(seat => seat.studioId === studio.studioId);
    // Get reserved seats for this showtime
    let bookingSeats = [];
    try {
      bookingSeats = readTable('BookingSeats');
      if (!Array.isArray(bookingSeats)) bookingSeats = [];
    } catch (e) {
      bookingSeats = [];
    }
    const reservedSeats = new Set(
      bookingSeats && Array.isArray(bookingSeats)
        ? bookingSeats.filter(bs => (bs && (bs.showtimeId === req.params.showtimeId || bs.showtimeId === Number(req.params.showtimeId)) && bs.seatNumber))
            .map(bs => bs.seatNumber)
        : []
    );
    // Build seat objects with availability
    const seats = studioSeats.map(seat => ({
      id: seat.seatId,
      label: seat.seatNumber,
      row: seat.rowNumber,
      available: seat.isActive && !reservedSeats.has(seat.seatNumber)
    }));
    // Get unique rows and columns
    const rowLabels = [...new Set(seats.map(seat => seat.row))];
    const columnLabels = [...new Set(seats.map(seat => seat.label.replace(/^[A-Z]/, '')))].sort((a, b) => Number(a) - Number(b));
    const movies = readTable('Movies');
    const movie = movies.find(m => m.movieId === showtime.movieId);
    res.json({
      showtimeId: showtime.showtimeId,
      movieTitle: movie ? movie.title : 'Unknown Movie',
      showTime: showtime.showDateTime,
      layout: { rows: rowLabels, columns: columnLabels, seats }
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
    
    // Calculate dynamic ticket price for the showtime date
    const ticketPrices = readTable('TicketPrices');
    const showDate = new Date(showtime.showDateTime);
    let applicablePrice = null;
    for (const price of ticketPrices) {
      const startDate = price.startDate ? new Date(price.startDate) : null;
      const endDate = price.endDate ? new Date(price.endDate) : null;
      // Check if date falls within range
      if (startDate && endDate) {
        if (showDate >= startDate && showDate <= endDate) {
          applicablePrice = price;
          break;
        }
      } else if (startDate && !endDate) {
        if (showDate >= startDate) {
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
      return res.status(400).json({
        error: 'Pricing Error',
        message: 'No applicable ticket price found for this date.'
      });
    }
    // Calculate total amount using dynamic price
    let totalAmount = seats.length * applicablePrice.price;
    const addOnItems = [];
    
    if (addOns && addOns.length > 0) {
      const allAddOns = readTable('AddOns');
      
      for (const addOn of addOns) {
        const addOnItem = allAddOns.find(item => item.addOnId === addOn.id);
        if (addOnItem) {
          totalAmount += addOnItem.price * addOn.quantity;
          addOnItems.push({ ...addOnItem, quantity: addOn.quantity });
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
      studioName: studio ? studio.name : 'N/A',
      totalAmount: totalAmount,
      bookingDate: new Date().toISOString(),
      status: 'confirmed'
    };
    
    bookings.push(newBooking);
    writeTable('Bookings', bookings);
    
    // Create booking seats
    const newBookingSeats = seats.map(seatNumber => {
      const newBookingSeatId = bookingSeats.length ? Math.max(...bookingSeats.map(bs => bs.bookingSeatId)) + 1 : 1;
      return {
        bookingSeatId: newBookingSeatId,
        bookingId: newBookingId,
        showtimeId: numericShowtimeId,
        seatNumber: seatNumber
      };
    });
    
    bookingSeats.push(...newBookingSeats);
    writeTable('BookingSeats', bookingSeats);
    
    // Create add-on sales if any
    if (addOnItems.length > 0) {
      const addOnSales = readTable('AddOnSales');
      const newAddOnSales = addOnItems.map(addOn => {
        const newAddOnSaleId = addOnSales.length ? Math.max(...addOnSales.map(aos => aos.addOnSaleId)) + 1 : 1;
        return {
          addOnSaleId: newAddOnSaleId,
          bookingId: newBookingId,
          addOnId: addOn.addOnId,
          quantity: addOn.quantity,
          unitPrice: addOn.price,
          TotalPrice: addOn.price * addOn.quantity
        };
      });
      
      addOnSales.push(...newAddOnSales);
      writeTable('AddOnSales', addOnSales);
    }
    
    // Generate QR codes for tickets
    const tickets = await Promise.all(seats.map(async (seatNumber) => {
      const movies = readTable('Movies');
      const movie = movies.find(m => m.movieId === showtime.movieId);
      
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
      .filter(b => b.userId === userId)
      .map(booking => {
        const showtime = showtimes.find(s => s.showtimeId === booking.showtimeId);
        const movie = movies.find(m => m.movieId === showtime?.movieId);
        const seats = bookingSeats
          .filter(bs => bs.bookingId === booking.bookingId)
          .map(bs => bs.seatNumber);
        const bookingAddOns = addOnSales
          .filter(aos => aos.bookingId === booking.bookingId)
          .map(aos => {
            const addOn = addOns.find(a => a.addOnId === aos.addOnId);
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
    const booking = bookings.find(b => b.bookingId === req.params.bookingId && b.userId === userId);
    
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
    
    const showtime = showtimes.find(s => s.showtimeId === booking.showtimeId);
    const movie = movies.find(m => m.movieId === showtime?.movieId);
    const seats = bookingSeats
      .filter(bs => bs.bookingId === booking.bookingId)
      .map(bs => bs.seatNumber);
    const bookingAddOns = addOnSales
      .filter(aos => aos.bookingId === booking.bookingId)
      .map(aos => {
        const addOn = addOns.find(a => a.addOnId === aos.addOnId);
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
        price: showtime.price
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
    const booking = bookings.find(b => b.bookingId === req.params.bookingId && b.userId === userId);
    
    if (!booking) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Booking not found'
      });
    }
    
    // Check if booking can be cancelled (e.g., not within 2 hours of showtime)
    const showtimes = readTable('Showtimes');
    const showtime = showtimes.find(s => s.showtimeId === booking.showtimeId);
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
    const bookingIndex = bookings.findIndex(b => b.bookingId === req.params.bookingId);
    bookings[bookingIndex].status = 'cancelled';
    writeTable('Bookings', bookings);
    
    // Remove booking seats
    let bookingSeats = readTable('BookingSeats');
    bookingSeats = bookingSeats.filter(bs => bs.bookingId !== req.params.bookingId);
    writeTable('BookingSeats', bookingSeats);
    
    // Remove add-on sales
    let addOnSales = readTable('AddOnSales');
    addOnSales = addOnSales.filter(aos => aos.bookingId !== req.params.bookingId);
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
    const booking = bookings.find(b => b.bookingId === req.params.bookingId && b.userId === userId);
    
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
    
    const showtime = showtimes.find(s => s.showtimeId === booking.showtimeId);
    const movie = movies.find(m => m.movieId === showtime?.movieId);
    const user = users.find(u => u.userId === userId);
    const studio = studios.find(s => s.studioId === showtime?.studioId);
    const seats = bookingSeats
      .filter(bs => bs.bookingId === booking.bookingId)
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
      studioName: booking.studioName || 'N/A',
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
  const showtime = showtimes.find(s => s.showtimeId === req.params.showtimeId);
  if (!showtime) {
    return res.status(404).json({ message: 'Not Found' });
  }
  res.json(showtime);
});

module.exports = router; 