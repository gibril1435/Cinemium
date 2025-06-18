const express = require('express');
const router = express.Router();
const { Movie, Showtime } = require('../models');
const { Op } = require('sequelize');
const { isAdmin } = require('../middleware/auth');

// Get currently showing movies
router.get('/now-showing', async (req, res) => {
    try {
        const { search } = req.query;
        const whereClause = search ? {
            Title: {
                [Op.like]: `%${search}%`
            }
        } : {};

        const movies = await Movie.findAll({
            where: whereClause,
            include: [{
                model: Showtime,
                where: {
                    ShowDateTime: {
                        [Op.gte]: new Date()
                    }
                },
                required: true
            }],
            attributes: ['MovieID', 'Title', 'Genre', 'PosterURL']
        });

        const formattedMovies = movies.map(movie => ({
            id: movie.MovieID,
            title: movie.Title,
            genre: movie.Genre,
            posterUrl: movie.PosterURL,
            showtimes: movie.Showtimes.map(showtime => ({
                time: showtime.ShowDateTime,
                price: showtime.Price
            }))
        }));

        res.json({ movies: formattedMovies });
    } catch (error) {
        console.error('Error fetching movies:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to fetch movies'
        });
    }
});

// Get movie details
router.get('/:id', async (req, res) => {
    try {
        const movie = await Movie.findByPk(req.params.id, {
            include: [
                {
                    model: Showtime,
                    where: {
                        ShowDateTime: {
                            [Op.gte]: new Date()
                        }
                    },
                    required: false
                }
            ]
        });

        if (!movie) {
            return res.status(404).json({
                error: 'Not Found',
                message: 'Movie not found'
            });
        }

        res.json({
            id: movie.MovieID,
            title: movie.Title,
            synopsis: movie.Synopsis,
            genre: movie.Genre,
            director: movie.Director,
            productionHouse: movie.ProductionHouse,
            posterUrl: movie.PosterURL,
            actors: movie.Actors ? movie.Actors.split(',').map(a => a.trim()) : [],
            showtimes: movie.Showtimes.map(showtime => ({
                id: showtime.ShowtimeID,
                time: showtime.ShowDateTime,
                studio: showtime.StudioID,
                price: showtime.Price
            }))
        });
    } catch (error) {
        console.error('Error fetching movie details:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to fetch movie details'
        });
    }
});

// Admin routes
router.use(isAdmin);

// Create movie
router.post('/', async (req, res) => {
    try {
        const {
            title,
            synopsis,
            genre,
            director,
            productionHouse,
            posterUrl,
            actors,
            duration
        } = req.body;

        const movie = await Movie.create({
            Title: title,
            Synopsis: synopsis,
            Genre: genre,
            Director: director,
            ProductionHouse: productionHouse,
            PosterURL: posterUrl,
            Actors: actors ? actors.join(', ') : '',
            Duration: duration
        });

        res.status(201).json(movie);
    } catch (error) {
        console.error('Error creating movie:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to create movie'
        });
    }
});

// Update movie
router.put('/:id', async (req, res) => {
    try {
        const movie = await Movie.findByPk(req.params.id);
        if (!movie) {
            return res.status(404).json({
                error: 'Not Found',
                message: 'Movie not found'
            });
        }

        const {
            title,
            synopsis,
            genre,
            director,
            productionHouse,
            posterUrl,
            actors,
            duration
        } = req.body;

        await movie.update({
            Title: title,
            Synopsis: synopsis,
            Genre: genre,
            Director: director,
            ProductionHouse: productionHouse,
            PosterURL: posterUrl,
            Actors: actors ? actors.join(', ') : '',
            Duration: duration
        });

        res.json(movie);
    } catch (error) {
        console.error('Error updating movie:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to update movie'
        });
    }
});

// Delete movie
router.delete('/:id', async (req, res) => {
    try {
        const movie = await Movie.findByPk(req.params.id);
        if (!movie) {
            return res.status(404).json({
                error: 'Not Found',
                message: 'Movie not found'
            });
        }
        await movie.destroy();
        res.json({ message: 'Movie deleted' });
    } catch (error) {
        console.error('Error deleting movie:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to delete movie'
        });
    }
});

module.exports = router; 