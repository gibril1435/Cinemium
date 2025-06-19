const express = require('express');
const router = express.Router();
const { readTable, writeTable } = require('../utils/jsonDb');

// Get all bookings
router.get('/', (req, res) => {
  const bookings = readTable('Bookings');
  res.json(bookings);
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
  let bookings = readTable('Bookings');
  const idx = bookings.findIndex(b => b.bookingId == req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Booking not found' });
  const deleted = bookings.splice(idx, 1)[0];
  writeTable('Bookings', bookings);
  res.json(deleted);
});

module.exports = router; 