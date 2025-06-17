const express = require('express');
const router = express.Router();
const { isAdmin } = require('../middleware/auth');
const scheduleManagementService = require('../services/scheduleManagement.service');

// Apply admin middleware to all routes
router.use(isAdmin);

// Check studio availability
router.get('/availability', async (req, res) => {
    try {
        const { studioId, startTime, endTime, excludeShowtimeId } = req.query;

        if (!studioId || !startTime || !endTime) {
            return res.status(400).json({
                message: 'Missing required parameters: studioId, startTime, endTime'
            });
        }

        const availability = await scheduleManagementService.checkStudioAvailability(
            studioId,
            new Date(startTime),
            new Date(endTime),
            excludeShowtimeId
        );

        res.json(availability);
    } catch (error) {
        console.error('Error checking availability:', error);
        res.status(500).json({
            message: 'Error checking studio availability',
            error: error.message
        });
    }
});

// Create new showtime
router.post('/showtimes', async (req, res) => {
    try {
        const { movieId, studioId, showDateTime } = req.body;

        if (!movieId || !studioId || !showDateTime) {
            return res.status(400).json({
                message: 'Missing required parameters: movieId, studioId, showDateTime'
            });
        }

        const showtime = await scheduleManagementService.createShowtime(
            movieId,
            studioId,
            new Date(showDateTime)
        );

        res.status(201).json(showtime);
    } catch (error) {
        console.error('Error creating showtime:', error);
        res.status(500).json({
            message: 'Error creating showtime',
            error: error.message
        });
    }
});

// Update showtime
router.put('/showtimes/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { showDateTime } = req.body;

        if (!showDateTime) {
            return res.status(400).json({
                message: 'Missing required parameter: showDateTime'
            });
        }

        const showtime = await scheduleManagementService.updateShowtime(
            id,
            new Date(showDateTime)
        );

        res.json(showtime);
    } catch (error) {
        console.error('Error updating showtime:', error);
        res.status(500).json({
            message: 'Error updating showtime',
            error: error.message
        });
    }
});

// Get optimal showtimes
router.get('/optimal-showtimes', async (req, res) => {
    try {
        const { movieId, studioId, date } = req.query;

        if (!movieId || !studioId || !date) {
            return res.status(400).json({
                message: 'Missing required parameters: movieId, studioId, date'
            });
        }

        const optimalShowtimes = await scheduleManagementService.getOptimalShowtimes(
            movieId,
            studioId,
            new Date(date)
        );

        res.json(optimalShowtimes);
    } catch (error) {
        console.error('Error getting optimal showtimes:', error);
        res.status(500).json({
            message: 'Error getting optimal showtimes',
            error: error.message
        });
    }
});

// Get studio schedule
router.get('/studio-schedule', async (req, res) => {
    try {
        const { studioId, startDate, endDate } = req.query;

        if (!studioId || !startDate || !endDate) {
            return res.status(400).json({
                message: 'Missing required parameters: studioId, startDate, endDate'
            });
        }

        const schedule = await scheduleManagementService.getStudioSchedule(
            studioId,
            new Date(startDate),
            new Date(endDate)
        );

        res.json(schedule);
    } catch (error) {
        console.error('Error getting studio schedule:', error);
        res.status(500).json({
            message: 'Error getting studio schedule',
            error: error.message
        });
    }
});

module.exports = router; 