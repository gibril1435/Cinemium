const express = require('express');
const router = express.Router();
const { readTable, writeTable } = require('../utils/jsonDb');

// Get all seats
router.get('/', (req, res) => {
  const seats = readTable('Seats');
  res.json(seats);
});

// Get a seat by ID
router.get('/:id', (req, res) => {
  const seats = readTable('Seats');
  const seat = seats.find(s => s.SeatID == req.params.id);
  if (!seat) return res.status(404).json({ error: 'Seat not found' });
  res.json(seat);
});

// Create a new seat
router.post('/', (req, res) => {
  const seats = readTable('Seats');
  const newId = seats.length ? Math.max(...seats.map(s => s.SeatID)) + 1 : 1;
  const newSeat = { ...req.body, SeatID: newId };
  seats.push(newSeat);
  writeTable('Seats', seats);
  res.status(201).json(newSeat);
});

// Update a seat
router.put('/:id', (req, res) => {
  const seats = readTable('Seats');
  const idx = seats.findIndex(s => s.SeatID == req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Seat not found' });
  seats[idx] = { ...seats[idx], ...req.body };
  writeTable('Seats', seats);
  res.json(seats[idx]);
});

// Delete a seat
router.delete('/:id', (req, res) => {
  let seats = readTable('Seats');
  const idx = seats.findIndex(s => s.SeatID == req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Seat not found' });
  const deleted = seats.splice(idx, 1)[0];
  writeTable('Seats', seats);
  res.json(deleted);
});

module.exports = router; 