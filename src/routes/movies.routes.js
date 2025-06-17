const express = require('express');
const router = express.Router();
const { Movie, Showtime, Actor, MovieActor } = require('../models');
const { Op } = require('sequelize');
const { isAdmin } = require('../middleware/auth');

// Get currently showing movies
router.get('/now-showing', async (req, res) => {
    try {
        const { search } = req.query;
        const whereClause = search ? {
            title: {
                [Op.like]: `%${search}%`
            }
        } : {};

        const movies = await Movie.findAll({
            where: whereClause,
            include: [{
                model: Showtime,
                where: {
                    showDateTime: {
                        [Op.gte]: new Date()
                    }
                },
                required: true
            }],
            attributes: ['id', 'title', 'genre', 'posterUrl']
        });

        const formattedMovies = movies.map(movie => ({
            id: movie.id,
            title: movie.title,
            genre: movie.genre,
            posterUrl: movie.posterUrl,
            showtimes: movie.Showtimes.map(showtime => ({
                time: showtime.showDateTime,
                price: showtime.price
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
                    model: Actor,
                    through: { attributes: [] }
                },
                {
                    model: Showtime,
                    where: {
                        showDateTime: {
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
            id: movie.id,
            title: movie.title,
            synopsis: movie.synopsis,
            genre: movie.genre,
            director: movie.director,
            productionHouse: movie.productionHouse,
            posterUrl: movie.posterUrl,
            actors: movie.Actors.map(actor => actor.name),
            showtimes: movie.Showtimes.map(showtime => ({
                id: showtime.id,
                time: showtime.showDateTime,
                studio: showtime.studioId,
                price: showtime.price
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
            actors
        } = req.body;

        const movie = await Movie.create({
            title,
            synopsis,
            genre,
            director,
            productionHouse,
            posterUrl
        });

        // Add actors
        if (actors && actors.length > 0) {
            const actorRecords = await Promise.all(
                actors.map(name => Actor.findOrCreate({ where: { name } }))
            );
            await movie.setActors(actorRecords.map(record => record[0]));
        }

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
            actors
        } = req.body;

        await movie.update({
            title,
            synopsis,
            genre,
            director,
            productionHouse,
            posterUrl,
            updatedAt: new Date()
        });

        // Update actors
        if (actors) {
            const actorRecords = await Promise.all(
                actors.map(name => Actor.findOrCreate({ where: { name } }))
            );
            await movie.setActors(actorRecords.map(record => record[0]));
        }

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
        res.json({ message: 'Movie deleted successfully' });
    } catch (error) {
        console.error('Error deleting movie:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to delete movie'
        });
    }
});

module.exports = router; 