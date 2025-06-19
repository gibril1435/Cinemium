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
    console.log('Requested showtimeId:', req.params.showtimeId, typeof req.params.showtimeId);
    showtimes.forEach(s => console.log('ShowtimeID in DB:', s.ShowtimeID, typeof s.ShowtimeID));
    const showtime = showtimes.find(s => s.ShowtimeID == req.params.showtimeId);
    
    if (!showtime) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Showtime not found'
      });
    }
    
    // Create 8x5 seat layout
    const rows = ['A', 'B', 'C', 'D', 'E'];
    const columns = [1, 2, 3, 4, 5, 6, 7, 8];
    
    // Get reserved seats from BookingSeats
    const bookingSeats = readTable('BookingSeats');
    const reservedSeats = new Set(
      bookingSeats
        .filter(bs => bs.showtimeId == req.params.showtimeId)
        .map(bs => bs.seatNumber)
    );
    
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
    
    const movies = readTable('Movies');
    const movie = movies.find(m => m.MovieID == showtime.movieId);
    
    res.json({
      showtimeId: showtime.id,
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
    
    // Validate seat count
    if (!seats || seats.length === 0 || seats.length > 4) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Must select between 1 and 4 seats'
      });
    }
    
    // Check if showtime exists
    const showtimes = readTable('Showtimes');
    const showtime = showtimes.find(s => s.ShowtimeID == showtimeId);
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
        .filter(bs => bs.showtimeId == showtimeId)
        .map(bs => bs.seatNumber)
    );
    
    const invalidSeats = seats.filter(seat => reservedSeats.has(seat));
    if (invalidSeats.length > 0) {
      return res.status(400).json({
        error: 'Validation Error',
        message: `Seats ${invalidSeats.join(', ')} are already reserved`
      });
    }
    
    // Calculate total amount
    let totalAmount = seats.length * showtime.price;
    const addOnItems = [];
    
    if (addOns && addOns.length > 0) {
      const allAddOns = readTable('AddOns');
      
      for (const addOn of addOns) {
        const addOnItem = allAddOns.find(item => item.AddOnID == addOn.id);
        if (addOnItem) {
          totalAmount += addOnItem.price * addOn.quantity;
          addOnItems.push({ ...addOnItem, quantity: addOn.quantity });
        }
      }
    }
    
    // Create booking
    const bookings = readTable('Bookings');
    const newBookingId = bookings.length ? Math.max(...bookings.map(b => b.BookingID)) + 1 : 1;
    
    const newBooking = {
      BookingID: newBookingId,
      UserID: userId,
      ShowtimeID: showtimeId,
      TotalAmount: totalAmount,
      BookingDate: new Date().toISOString(),
      Status: 'confirmed'
    };
    
    bookings.push(newBooking);
    writeTable('Bookings', bookings);
    
    // Create booking seats
    const newBookingSeats = seats.map(seatNumber => {
      const newBookingSeatId = bookingSeats.length ? Math.max(...bookingSeats.map(bs => bs.BookingSeatID)) + 1 : 1;
      return {
        BookingSeatID: newBookingSeatId,
        BookingID: newBookingId,
        ShowtimeID: showtimeId,
        SeatNumber: seatNumber
      };
    });
    
    bookingSeats.push(...newBookingSeats);
    writeTable('BookingSeats', bookingSeats);
    
    // Create add-on sales if any
    if (addOnItems.length > 0) {
      const addOnSales = readTable('AddOnSales');
      const newAddOnSales = addOnItems.map(addOn => {
        const newAddOnSaleId = addOnSales.length ? Math.max(...addOnSales.map(aos => aos.AddOnSaleID)) + 1 : 1;
        return {
          AddOnSaleID: newAddOnSaleId,
          BookingID: newBookingId,
          AddOnID: addOn.AddOnID,
          Quantity: addOn.quantity,
          UnitPrice: addOn.price,
          TotalPrice: addOn.price * addOn.quantity
        };
      });
      
      addOnSales.push(...newAddOnSales);
      writeTable('AddOnSales', addOnSales);
    }
    
    // Generate QR codes for tickets
    const tickets = await Promise.all(seats.map(async (seatNumber) => {
      const movies = readTable('Movies');
      const movie = movies.find(m => m.MovieID == showtime.movieId);
      
      const qrCode = await QRCode.toDataURL(JSON.stringify({
        bookingId: newBookingId,
        seatNumber,
        showtimeId,
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
    const bookings = readTable('Bookings');
    const showtimes = readTable('Showtimes');
    const movies = readTable('Movies');
    const bookingSeats = readTable('BookingSeats');
    const addOnSales = readTable('AddOnSales');
    const addOns = readTable('AddOns');
    
    const userBookings = bookings
      .filter(b => b.UserID == userId)
      .map(booking => {
        const showtime = showtimes.find(s => s.ShowtimeID == booking.ShowtimeID);
        const movie = movies.find(m => m.MovieID == showtime?.movieId);
        const seats = bookingSeats
          .filter(bs => bs.BookingID == booking.BookingID)
          .map(bs => bs.SeatNumber);
        const bookingAddOns = addOnSales
          .filter(aos => aos.BookingID == booking.BookingID)
          .map(aos => {
            const addOn = addOns.find(a => a.AddOnID == aos.AddOnID);
            return {
              name: addOn ? addOn.name : 'Unknown Add-on',
              quantity: aos.Quantity,
              unitPrice: aos.UnitPrice,
              totalPrice: aos.TotalPrice
            };
          });
        
        return {
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
      })
      .sort((a, b) => new Date(b.BookingDate) - new Date(a.BookingDate));
    
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
    const bookings = readTable('Bookings');
    const booking = bookings.find(b => b.BookingID == req.params.bookingId && b.UserID == userId);
    
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
    
    const showtime = showtimes.find(s => s.ShowtimeID == booking.ShowtimeID);
    const movie = movies.find(m => m.MovieID == showtime?.movieId);
    const seats = bookingSeats
      .filter(bs => bs.BookingID == booking.BookingID)
      .map(bs => bs.SeatNumber);
    const bookingAddOns = addOnSales
      .filter(aos => aos.BookingID == booking.BookingID)
      .map(aos => {
        const addOn = addOns.find(a => a.AddOnID == aos.AddOnID);
        return {
          name: addOn ? addOn.name : 'Unknown Add-on',
          quantity: aos.Quantity,
          unitPrice: aos.UnitPrice,
          totalPrice: aos.TotalPrice
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
    let bookings = readTable('Bookings');
    const booking = bookings.find(b => b.BookingID == req.params.bookingId && b.UserID == userId);
    
    if (!booking) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Booking not found'
      });
    }
    
    // Check if booking can be cancelled (e.g., not within 2 hours of showtime)
    const showtimes = readTable('Showtimes');
    const showtime = showtimes.find(s => s.ShowtimeID == booking.ShowtimeID);
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
    const bookingIndex = bookings.findIndex(b => b.BookingID == req.params.bookingId);
    bookings[bookingIndex].Status = 'cancelled';
    writeTable('Bookings', bookings);
    
    // Remove booking seats
    let bookingSeats = readTable('BookingSeats');
    bookingSeats = bookingSeats.filter(bs => bs.BookingID != req.params.bookingId);
    writeTable('BookingSeats', bookingSeats);
    
    // Remove add-on sales
    let addOnSales = readTable('AddOnSales');
    addOnSales = addOnSales.filter(aos => aos.BookingID != req.params.bookingId);
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
    const bookings = readTable('Bookings');
    const booking = bookings.find(b => b.BookingID == req.params.bookingId && b.UserID == userId);
    
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
    
    const showtime = showtimes.find(s => s.ShowtimeID == booking.ShowtimeID);
    const movie = movies.find(m => m.MovieID == showtime?.movieId);
    const user = users.find(u => u.UserID == userId);
    const seats = bookingSeats
      .filter(bs => bs.BookingID == booking.BookingID)
      .map(bs => bs.SeatNumber);
    
    const ticketData = {
      bookingId: booking.BookingID,
      userName: user ? user.username : 'Unknown User',
      movieTitle: movie ? movie.title : 'Unknown Movie',
      showTime: showtime ? showtime.showDateTime : 'Unknown Time',
      seats: seats.join(', '),
      totalAmount: booking.TotalAmount,
      bookingDate: booking.BookingDate
    };
    
    const pdfBuffer = await generateTicketPDF(ticketData);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=ticket-${booking.BookingID}.pdf`);
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
  const showtime = showtimes.find(s => s.ShowtimeID == req.params.showtimeId);
  if (!showtime) {
    return res.status(404).json({ message: 'Not Found' });
  }
  res.json(showtime);
});

module.exports = router; 