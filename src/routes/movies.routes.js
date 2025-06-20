const express = require('express');
const router = express.Router();
const { isAdmin } = require('../middleware/auth');
const { readTable, writeTable } = require('../utils/jsonDb');

/**
 * @swagger
 * components:
 *   schemas:
 *     Movie:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         title:
 *           type: string
 *         genre:
 *           type: string
 *         synopsis:
 *           type: string
 *         posterUrl:
 *           type: string
 *     User:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         username:
 *           type: string
 *         isAdmin:
 *           type: boolean
 *         createdAt:
 *           type: string
 *           format: date-time
 *         lastLoginAt:
 *           type: string
 *           format: date-time
 *     Booking:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         userId:
 *           type: integer
 *         showtimeId:
 *           type: integer
 *         bookingDateTime:
 *           type: string
 *           format: date-time
 *         totalAmount:
 *           type: number
 *         status:
 *           type: string
 *     BookingSeat:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         bookingId:
 *           type: integer
 *         seatId:
 *           type: integer
 *     AddOn:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         name:
 *           type: string
 *         description:
 *           type: string
 *         price:
 *           type: number
 *         stock:
 *           type: integer
 *         isActive:
 *           type: boolean
 *     AddOnSale:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         bookingId:
 *           type: integer
 *         addOnId:
 *           type: integer
 *         quantity:
 *           type: integer
 *         unitPrice:
 *           type: number
 *     Promotion:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         title:
 *           type: string
 *         description:
 *           type: string
 *         imageUrl:
 *           type: string
 *         startDate:
 *           type: string
 *           format: date-time
 *         endDate:
 *           type: string
 *           format: date-time
 *     Seat:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         studioId:
 *           type: integer
 *         seatNumber:
 *           type: string
 *         rowNumber:
 *           type: string
 *         isActive:
 *           type: boolean
 *     Showtime:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         movieId:
 *           type: integer
 *         studioId:
 *           type: integer
 *         showDateTime:
 *           type: string
 *           format: date-time
 *         price:
 *           type: number
 *         isActive:
 *           type: boolean
 *     Studio:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         studioNumber:
 *           type: integer
 *         capacity:
 *           type: integer
 *         isActive:
 *           type: boolean
 *     Notification:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         userId:
 *           type: integer
 *         type:
 *           type: string
 *         title:
 *           type: string
 *         message:
 *           type: string
 *         data:
 *           type: object
 *         read:
 *           type: boolean
 *         createdAt:
 *           type: string
 *           format: date-time
 *     TicketPrice:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         type:
 *           type: string
 *         price:
 *           type: number
 *         startDate:
 *           type: string
 *           format: date-time
 *         endDate:
 *           type: string
 *           format: date-time
 *         dayOfWeek:
 *           type: integer
 *         isHoliday:
 *           type: boolean
 *         description:
 *           type: string
 *
 * @swagger
 * /api/movies:
 *   get:
 *     summary: Get all movies
 *     tags: [Movies]
 *     responses:
 *       200:
 *         description: List of all movies
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Movie'
 */

// Public routes (no authentication required)
// Get all movies
router.get('/', (req, res) => {
  const movies = readTable('Movies');
  res.json(movies);
});

// Get a movie by ID
router.get('/:id', (req, res) => {
  const movies = readTable('Movies');
  const movie = movies.find(m => m.movieId == req.params.id);
  if (!movie) return res.status(404).json({ error: 'Movie not found' });
  res.json(movie);
});

// Admin routes (authentication required)
// Create a new movie
router.post('/', isAdmin, (req, res) => {
  const movies = readTable('Movies');
  const newId = movies.length ? Math.max(...movies.map(m => m.MovieID)) + 1 : 1;
  const newMovie = { ...req.body, MovieID: newId };
  movies.push(newMovie);
  writeTable('Movies', movies);
  res.status(201).json(newMovie);
});

// Update a movie
router.put('/:id', isAdmin, (req, res) => {
  const movies = readTable('Movies');
  const idx = movies.findIndex(m => m.MovieID == req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Movie not found' });
  movies[idx] = { ...movies[idx], ...req.body };
  writeTable('Movies', movies);
  res.json(movies[idx]);
});

// Delete a movie
router.delete('/:id', isAdmin, (req, res) => {
  let movies = readTable('Movies');
  const idx = movies.findIndex(m => m.MovieID == req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Movie not found' });
  const deleted = movies.splice(idx, 1)[0];
  writeTable('Movies', movies);
  res.json(deleted);
});

module.exports = router; 