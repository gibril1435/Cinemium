const express = require('express');
const router = express.Router();
const { readTable, writeTable } = require('../utils/jsonDb');

// Get all booking seats
router.get('/', (req, res) => {
  const bookingSeats = readTable('BookingSeats');
  res.json(bookingSeats);
});

// Get a booking seat by ID
router.get('/:id', (req, res) => {
  const bookingSeats = readTable('BookingSeats');
  const seat = bookingSeats.find(s => s.BookingSeatID == req.params.id);
  if (!seat) return res.status(404).json({ error: 'BookingSeat not found' });
  res.json(seat);
});

// Create a new booking seat
router.post('/', (req, res) => {
  const bookingSeats = readTable('BookingSeats');
  const newId = bookingSeats.length ? Math.max(...bookingSeats.map(s => s.BookingSeatID)) + 1 : 1;
  const newSeat = { ...req.body, BookingSeatID: newId };
  bookingSeats.push(newSeat);
  writeTable('BookingSeats', bookingSeats);
  res.status(201).json(newSeat);
});

// Update a booking seat
router.put('/:id', (req, res) => {
  const bookingSeats = readTable('BookingSeats');
  const idx = bookingSeats.findIndex(s => s.BookingSeatID == req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'BookingSeat not found' });
  bookingSeats[idx] = { ...bookingSeats[idx], ...req.body };
  writeTable('BookingSeats', bookingSeats);
  res.json(bookingSeats[idx]);
});

// Delete a booking seat
router.delete('/:id', (req, res) => {
  let bookingSeats = readTable('BookingSeats');
  const idx = bookingSeats.findIndex(s => s.BookingSeatID == req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'BookingSeat not found' });
  const deleted = bookingSeats.splice(idx, 1)[0];
  writeTable('BookingSeats', bookingSeats);
  res.json(deleted);
});

module.exports = router; 