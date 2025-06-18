const express = require('express');
const router = express.Router();
const { Studio, Showtime, Movie } = require('../models');
const { isAdmin } = require('../middleware/auth');
const { Op } = require('sequelize');

// Apply admin middleware to all routes
router.use(isAdmin);

// Get all studios
router.get('/', async (req, res) => {
    try {
        const { includeShowtimes } = req.query;
        
        const studios = await Studio.findAll({
            include: includeShowtimes ? [{
                model: Showtime,
                include: [{ model: Movie, attributes: ['Title'] }],
                where: {
                    ShowDateTime: {
                        [Op.gte]: new Date()
                    }
                },
                required: false
            }] : []
        });

        res.json({ studios });
    } catch (error) {
        console.error('Error fetching studios:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to fetch studios'
        });
    }
});

// Get studio by ID
router.get('/:id', async (req, res) => {
    try {
        const studio = await Studio.findByPk(req.params.id, {
            include: [{
                model: Showtime,
                include: [{ model: Movie, attributes: ['Title'] }],
                where: {
                    ShowDateTime: {
                        [Op.gte]: new Date()
                    }
                },
                required: false
            }]
        });

        if (!studio) {
            return res.status(404).json({
                error: 'Not Found',
                message: 'Studio not found'
            });
        }

        res.json(studio);
    } catch (error) {
        console.error('Error fetching studio:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to fetch studio'
        });
    }
});

// Create new studio
router.post('/', async (req, res) => {
    try {
        const { studioNumber, capacity } = req.body;

        // Validate required fields
        if (!studioNumber || !capacity) {
            return res.status(400).json({
                error: 'Validation Error',
                message: 'StudioNumber and Capacity are required'
            });
        }

        // Check if studio with same number exists
        const existingStudio = await Studio.findOne({ where: { StudioNumber: studioNumber } });
        if (existingStudio) {
            return res.status(400).json({
                error: 'Validation Error',
                message: 'Studio with this number already exists'
            });
        }

        const studio = await Studio.create({
            StudioNumber: studioNumber,
            Capacity: capacity
        });

        res.status(201).json(studio);
    } catch (error) {
        console.error('Error creating studio:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to create studio'
        });
    }
});

// Update studio
router.put('/:id', async (req, res) => {
    try {
        const studio = await Studio.findByPk(req.params.id);
        
        if (!studio) {
            return res.status(404).json({
                error: 'Not Found',
                message: 'Studio not found'
            });
        }

        const { studioNumber, capacity } = req.body;

        // Check number uniqueness if number is being changed
        if (studioNumber && studioNumber !== studio.StudioNumber) {
            const existingStudio = await Studio.findOne({ where: { StudioNumber: studioNumber } });
            if (existingStudio) {
                return res.status(400).json({
                    error: 'Validation Error',
                    message: 'Studio with this number already exists'
                });
            }
        }

        await studio.update({
            StudioNumber: studioNumber || studio.StudioNumber,
            Capacity: capacity || studio.Capacity
        });

        res.json(studio);
    } catch (error) {
        console.error('Error updating studio:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to update studio'
        });
    }
});

// Delete studio
router.delete('/:id', async (req, res) => {
    try {
        const studio = await Studio.findByPk(req.params.id);
        
        if (!studio) {
            return res.status(404).json({
                error: 'Not Found',
                message: 'Studio not found'
            });
        }

        // Check if studio has any upcoming showtimes
        const upcomingShowtimes = await Showtime.count({
            where: {
                studioId: studio.id,
                showDateTime: {
                    [Op.gte]: new Date()
                }
            }
        });

        if (upcomingShowtimes > 0) {
            return res.status(400).json({
                error: 'Validation Error',
                message: 'Cannot delete studio with upcoming showtimes'
            });
        }

        await studio.destroy();
        res.json({ message: 'Studio deleted successfully' });
    } catch (error) {
        console.error('Error deleting studio:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to delete studio'
        });
    }
});

// Get studio schedule
router.get('/:id/schedule', async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const studio = await Studio.findByPk(req.params.id);

        if (!studio) {
            return res.status(404).json({
                error: 'Not Found',
                message: 'Studio not found'
            });
        }

        const whereClause = {
            studioId: studio.id
        };

        if (startDate && endDate) {
            whereClause.showDateTime = {
                [Op.between]: [new Date(startDate), new Date(endDate)]
            };
        }

        const schedule = await Showtime.findAll({
            where: whereClause,
            include: [{ model: Movie, attributes: ['title', 'duration'] }],
            order: [['showDateTime', 'ASC']]
        });

        res.json({
            studioId: studio.id,
            studioName: studio.name,
            schedule: schedule.map(showtime => ({
                id: showtime.id,
                movieTitle: showtime.Movie.title,
                showDateTime: showtime.showDateTime,
                duration: showtime.Movie.duration,
                price: showtime.price
            }))
        });
    } catch (error) {
        console.error('Error fetching studio schedule:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to fetch studio schedule'
        });
    }
});

// Update studio layout
router.patch('/:id/layout', async (req, res) => {
    try {
        const { layout } = req.body;
        const studio = await Studio.findByPk(req.params.id);

        if (!studio) {
            return res.status(404).json({
                error: 'Not Found',
                message: 'Studio not found'
            });
        }

        // Validate layout
        if (!Array.isArray(layout) || layout.length !== 5) {
            return res.status(400).json({
                error: 'Validation Error',
                message: 'Layout must be an array of 5 rows'
            });
        }

        for (const row of layout) {
            if (!Array.isArray(row) || row.length !== 8) {
                return res.status(400).json({
                    error: 'Validation Error',
                    message: 'Each row must contain exactly 8 seats'
                });
            }

            // Validate seat status values
            for (const seat of row) {
                if (!['available', 'reserved', 'maintenance'].includes(seat)) {
                    return res.status(400).json({
                        error: 'Validation Error',
                        message: 'Invalid seat status. Use: available, reserved, or maintenance'
                    });
                }
            }
        }

        await studio.update({ layout });
        res.json(studio);
    } catch (error) {
        console.error('Error updating studio layout:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to update studio layout'
        });
    }
});

module.exports = router; 