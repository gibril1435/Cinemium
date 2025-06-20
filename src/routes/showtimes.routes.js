const express = require('express');
const router = express.Router();
const { readTable, writeTable } = require('../utils/jsonDb');
const { isAdmin } = require('../middleware/auth');

// Get all showtimes
router.get('/', (req, res) => {
  const showtimes = readTable('Showtimes');
  res.json(showtimes);
});

// Get a showtime by ID
router.get('/:id', (req, res) => {
  const showtimes = readTable('Showtimes');
  const showtime = showtimes.find(s => s.showtimeId === req.params.id);
  if (!showtime) return res.status(404).json({ error: 'Showtime not found' });
  res.json(showtime);
});

// Create a new showtime
router.post('/', isAdmin, (req, res) => {
  const showtimes = readTable('Showtimes');
  const newId = showtimes.length ? Math.max(...showtimes.map(s => s.showtimeId)) + 1 : 1;
  const newShowtime = { ...req.body, showtimeId: newId };
  showtimes.push(newShowtime);
  writeTable('Showtimes', showtimes);
  res.status(201).json(newShowtime);
});

// Update a showtime
router.put('/:id', isAdmin, (req, res) => {
  const showtimes = readTable('Showtimes');
  const idx = showtimes.findIndex(s => s.showtimeId === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Showtime not found' });
  showtimes[idx] = { ...showtimes[idx], ...req.body };
  writeTable('Showtimes', showtimes);
  res.json(showtimes[idx]);
});

// Delete a showtime
router.delete('/:id', isAdmin, (req, res) => {
  let showtimes = readTable('Showtimes');
  const idx = showtimes.findIndex(s => s.showtimeId === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Showtime not found' });
  const deleted = showtimes.splice(idx, 1)[0];
  writeTable('Showtimes', showtimes);
  res.json(deleted);
});

// Get all showtimes for a specific movieId
router.get('/movie/:movieId', (req, res) => {
  const showtimes = readTable('Showtimes');
  const movieId = Number(req.params.movieId);
  const filtered = showtimes.filter(s => s.movieId === movieId);
  res.json(filtered);
});

module.exports = router; 