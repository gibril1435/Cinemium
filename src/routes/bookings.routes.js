const express = require('express');
const router = express.Router();
const { readTable, writeTable } = require('../utils/jsonDb');

// Get all bookings
router.get('/', (req, res) => {
  const bookings = readTable('Bookings');
  const bookingSeats = readTable('BookingSeats');
  const showtimes = readTable('Showtimes');
  const movies = readTable('Movies');
  const users = readTable('Users');
  const enhanced = bookings.map(b => {
    const seats = bookingSeats.filter(bs => bs.bookingId === b.bookingId).map(bs => bs.seatNumber);
    const showtime = showtimes.find(s => s.showtimeId === b.showtimeId);
    const movie = showtime ? movies.find(m => m.movieId === showtime.movieId) : null;
    const user = users.find(u => u.userId === b.userId);

    let dynamicStatus = b.status;
    if (showtime && b.status === 'confirmed' && new Date(showtime.showDateTime) < new Date()) {
      dynamicStatus = 'completed';
    }

    return {
      ...b,
      status: dynamicStatus,
      seats,
      movieTitle: movie ? movie.title : '',
      posterUrl: movie ? movie.posterUrl : '',
      user: user ? { username: user.username, email: user.email } : null,
      showtimeDate: showtime ? showtime.showDateTime : '',
      showtimeTime: showtime ? new Date(showtime.showDateTime).toLocaleTimeString() : '',
    };
  });
  res.json(enhanced);
});

// Get a booking by ID
router.get('/:id', (req, res) => {
  const bookings = readTable('Bookings');
  const booking = bookings.find(b => b.bookingId == req.params.id);
  if (!booking) return res.status(404).json({ error: 'Booking not found' });
  res.json(booking);
});

// Create a new booking
router.post('/', (req, res) => {
  const bookings = readTable('Bookings');
  const newId = bookings.length ? Math.max(...bookings.map(b => b.bookingId)) + 1 : 1;
  const newBooking = { ...req.body, bookingId: newId };
  bookings.push(newBooking);
  writeTable('Bookings', bookings);
  res.status(201).json(newBooking);
});

// Update a booking
router.put('/:id', (req, res) => {
  const bookings = readTable('Bookings');
  const idx = bookings.findIndex(b => b.bookingId == req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Booking not found' });
  bookings[idx] = { ...bookings[idx], ...req.body };
  writeTable('Bookings', bookings);
  res.json(bookings[idx]);
});

// Delete a booking
router.delete('/:id', (req, res) => {
  const bookingIdToDelete = req.params.id;

  // Delete from Bookings
  let bookings = readTable('Bookings');
  const idx = bookings.findIndex(b => b.bookingId == bookingIdToDelete);
  if (idx === -1) {
    return res.status(404).json({ error: 'Booking not found' });
  }
  const deleted = bookings.splice(idx, 1)[0];
  writeTable('Bookings', bookings);

  // Delete from BookingSeats
  let bookingSeats = readTable('BookingSeats');
  const updatedBookingSeats = bookingSeats.filter(bs => bs.bookingId != bookingIdToDelete);
  writeTable('BookingSeats', updatedBookingSeats);

  // Also delete associated add-on sales
  let addOnSales = readTable('AddOnSales');
  const updatedAddOnSales = addOnSales.filter(aos => aos.bookingId != bookingIdToDelete);
  writeTable('AddOnSales', updatedAddOnSales);

  res.json(deleted);
});

module.exports = router; 