const express = require('express');
const router = express.Router();
const { readTable, writeTable } = require('../utils/jsonDb');

// Get all showtimes
router.get('/', (req, res) => {
  let showtimes = readTable('Showtimes');
  const { movieId } = req.query;

  if (movieId) {
    showtimes = showtimes.filter(st => st.movieId == movieId);
  }

  const movies = readTable('Movies');
  const studios = readTable('Studios');

  const enhancedShowtimes = showtimes.map(st => {
    const movie = movies.find(m => m.movieId === st.movieId);
    const studio = studios.find(s => s.studioId === st.studioId);

    const now = new Date();
    const showDateTime = new Date(st.showDateTime);
    let status = 'scheduled';
    if (st.isActive === false) {
      status = 'cancelled';
    } else if (showDateTime < now) {
      status = 'completed';
    }

    return {
      ...st,
      movie: movie ? { title: movie.title, posterUrl: movie.posterUrl } : null,
      studio: studio ? { studioNumber: studio.studioNumber } : null,
      status,
    };
  });
  res.json(enhancedShowtimes);
});

// Get a showtime by ID
router.get('/:id', (req, res) => {
  const showtimes = readTable('Showtimes');
  const showtime = showtimes.find(s => s.showtimeId == req.params.id);
  if (!showtime) return res.status(404).json({ error: 'Showtime not found' });
  res.json(showtime);
});

// Create a new showtime
router.post('/', (req, res) => {
  const showtimes = readTable('Showtimes');
  const newId = showtimes.length ? Math.max(...showtimes.map(s => s.showtimeId)) + 1 : 1;
  const newShowtime = { ...req.body, showtimeId: newId };
  showtimes.push(newShowtime);
  writeTable('Showtimes', showtimes);
  res.status(201).json(newShowtime);
});

// Update a showtime
router.put('/:id', (req, res) => {
  const showtimes = readTable('Showtimes');
  const idx = showtimes.findIndex(s => s.showtimeId == req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Showtime not found' });
  showtimes[idx] = { ...showtimes[idx], ...req.body };
  writeTable('Showtimes', showtimes);
  res.json(showtimes[idx]);
});

// Delete a showtime
router.delete('/:id', (req, res) => {
  let showtimes = readTable('Showtimes');
  const idx = showtimes.findIndex(s => s.showtimeId == req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Showtime not found' });
  const deleted = showtimes.splice(idx, 1)[0];
  writeTable('Showtimes', showtimes);
  res.json(deleted);
});

module.exports = router; 