const express = require('express');
const router = express.Router();
const { readTable, writeTable } = require('../utils/jsonDb');
const { isAdmin } = require('../middleware/auth');

// Apply admin middleware to all routes
router.use(isAdmin);

/**
 * @swagger
 * tags:
 *   - name: ScheduleManagement
 *     description: Schedule management (admin only)
 * /api/admin/schedule:
 *   get:
 *     summary: Get all schedules (admin)
 *     tags: [ScheduleManagement]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of schedules
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /api/admin/schedule/availability:
 *   get:
 *     summary: Check studio availability
 *     tags: [ScheduleManagement]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: studioId
 *         schema:
 *           type: integer
 *         description: Studio ID
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *         description: Date to check
 *     responses:
 *       200:
 *         description: Studio availability
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 available:
 *                   type: boolean
 *       401:
 *         description: Unauthorized
 */

// Get all schedules
router.get('/', (req, res) => {
  try {
    const showtimes = readTable('Showtimes');
    const movies = readTable('Movies');
    const studios = readTable('Studios');
    
    // Join data for complete schedule information
    const schedules = showtimes.map(showtime => {
      const movie = movies.find(m => m.movieId == showtime.movieId);
      const studio = studios.find(s => s.studioId == showtime.studioId);
      
      return {
        ...showtime,
        movie: movie ? { title: movie.title, duration: movie.duration } : null,
        studio: studio ? { number: studio.studioNumber, capacity: studio.capacity } : null
      };
    });
    
    res.json(schedules);
  } catch (error) {
    console.error('Error fetching schedules:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch schedules'
    });
  }
});

// Get a schedule by ID
router.get('/:id', (req, res) => {
  try {
    const showtimes = readTable('Showtimes');
    const showtime = showtimes.find(s => s.showtimeId == req.params.id);
    
    if (!showtime) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Schedule not found'
      });
    }
    
    const movies = readTable('Movies');
    const studios = readTable('Studios');
    
    const movie = movies.find(m => m.movieId == showtime.movieId);
    const studio = studios.find(s => s.studioId == showtime.studioId);
    
    const schedule = {
      ...showtime,
      movie: movie ? { title: movie.title, duration: movie.duration } : null,
      studio: studio ? { number: studio.studioNumber, capacity: studio.capacity } : null
    };
    
    res.json(schedule);
  } catch (error) {
    console.error('Error fetching schedule:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch schedule'
    });
  }
});

// Create a new schedule
router.post('/', (req, res) => {
  try {
    const { movieId, studioId, showDateTime, price } = req.body;
    
    if (!movieId || !studioId || !showDateTime) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'movieId, studioId, and showDateTime are required'
      });
    }
    
    const showtimes = readTable('Showtimes');
    const newId = showtimes.length ? Math.max(...showtimes.map(s => s.showtimeId)) + 1 : 1;
    
    const newSchedule = {
      showtimeId: newId,
      movieId: parseInt(movieId),
      studioId: parseInt(studioId),
      showDateTime: new Date(showDateTime).toISOString(),
      price: price || 50000,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    showtimes.push(newSchedule);
    writeTable('Showtimes', showtimes);
    res.status(201).json(newSchedule);
  } catch (error) {
    console.error('Error creating schedule:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to create schedule'
    });
  }
});

// Update a schedule
router.put('/:id', (req, res) => {
  try {
    const showtimes = readTable('Showtimes');
    const idx = showtimes.findIndex(s => s.showtimeId == req.params.id);
    
    if (idx === -1) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Schedule not found'
      });
    }
    
    showtimes[idx] = {
      ...showtimes[idx],
      ...req.body,
      updatedAt: new Date().toISOString()
    };
    
    writeTable('Showtimes', showtimes);
    res.json(showtimes[idx]);
  } catch (error) {
    console.error('Error updating schedule:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to update schedule'
    });
  }
});

// Delete a schedule
router.delete('/:id', (req, res) => {
  try {
    let showtimes = readTable('Showtimes');
    const idx = showtimes.findIndex(s => s.showtimeId == req.params.id);
    
    if (idx === -1) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Schedule not found'
      });
    }
    
    const deleted = showtimes.splice(idx, 1)[0];
    writeTable('Showtimes', showtimes);
    res.json({ message: 'Schedule deleted successfully', deleted });
  } catch (error) {
    console.error('Error deleting schedule:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to delete schedule'
    });
  }
});

// Check studio availability
router.get('/availability', (req, res) => {
  try {
    const { studioId, startTime, endTime, excludeShowtimeId } = req.query;
    
    if (!studioId || !startTime || !endTime) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Missing required parameters: studioId, startTime, endTime'
      });
    }
    
    const showtimes = readTable('Showtimes');
    const targetStart = new Date(startTime);
    const targetEnd = new Date(endTime);
    
    // Check for conflicts
    const conflicts = showtimes.filter(showtime => {
      if (showtime.studioId != studioId) return false;
      if (excludeShowtimeId && showtime.showtimeId == excludeShowtimeId) return false;
      
      const showtimeStart = new Date(showtime.showDateTime);
      const showtimeEnd = new Date(showtimeStart.getTime() + 120 * 60000); // Assume 2 hours per movie
      
      return (targetStart < showtimeEnd && targetEnd > showtimeStart);
    });
    
    const available = conflicts.length === 0;
    
    res.json({
      available,
      conflicts: conflicts.map(c => ({
        id: c.showtimeId,
        showDateTime: c.showDateTime,
        movieId: c.movieId
      }))
    });
  } catch (error) {
    console.error('Error checking availability:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to check studio availability'
    });
  }
});

// Create new showtime
router.post('/showtimes', (req, res) => {
  try {
    const { movieId, studioId, showDateTime, price } = req.body;
    
    if (!movieId || !studioId || !showDateTime) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Missing required parameters: movieId, studioId, showDateTime'
      });
    }
    
    const showtimes = readTable('Showtimes');
    const newId = showtimes.length ? Math.max(...showtimes.map(s => s.showtimeId)) + 1 : 1;
    
    const newShowtime = {
      showtimeId: newId,
      movieId: parseInt(movieId),
      studioId: parseInt(studioId),
      showDateTime: new Date(showDateTime).toISOString(),
      price: price || 12.50,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    showtimes.push(newShowtime);
    writeTable('Showtimes', showtimes);
    res.status(201).json(newShowtime);
  } catch (error) {
    console.error('Error creating showtime:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to create showtime'
    });
  }
});

// Update showtime
router.put('/showtimes/:id', (req, res) => {
  try {
    const { showDateTime, price } = req.body;
    
    if (!showDateTime) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Missing required parameter: showDateTime'
      });
    }
    
    const showtimes = readTable('Showtimes');
    const idx = showtimes.findIndex(s => s.showtimeId == req.params.id);
    
    if (idx === -1) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Showtime not found'
      });
    }
    
    showtimes[idx] = {
      ...showtimes[idx],
      showDateTime: new Date(showDateTime).toISOString(),
      price: price || showtimes[idx].price,
      updatedAt: new Date().toISOString()
    };
    
    writeTable('Showtimes', showtimes);
    res.json(showtimes[idx]);
  } catch (error) {
    console.error('Error updating showtime:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to update showtime'
    });
  }
});

// Get optimal showtimes
router.get('/optimal-showtimes', (req, res) => {
  try {
    const { movieId, studioId, date } = req.query;
    
    if (!movieId || !studioId || !date) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Missing required parameters: movieId, studioId, date'
      });
    }
    
    const showtimes = readTable('Showtimes');
    const targetDate = new Date(date);
    const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));
    
    // Get existing showtimes for the studio on that date
    const existingShowtimes = showtimes.filter(s => {
      if (s.studioId != studioId) return false;
      const showtimeDate = new Date(s.showDateTime);
      return showtimeDate >= startOfDay && showtimeDate <= endOfDay;
    });
    
    // Suggest optimal times (every 3 hours starting from 10 AM)
    const suggestedTimes = [];
    const baseTime = new Date(targetDate);
    baseTime.setHours(10, 0, 0, 0);
    
    for (let i = 0; i < 5; i++) {
      const suggestedTime = new Date(baseTime.getTime() + i * 3 * 60 * 60 * 1000);
      
      // Check if this time conflicts with existing showtimes
      const conflicts = existingShowtimes.filter(existing => {
        const existingTime = new Date(existing.showDateTime);
        const existingEnd = new Date(existingTime.getTime() + 120 * 60000); // 2 hours
        return suggestedTime < existingEnd && suggestedTime > existingTime;
      });
      
      if (conflicts.length === 0) {
        suggestedTimes.push({
          time: suggestedTime.toISOString(),
          available: true
        });
      } else {
        suggestedTimes.push({
          time: suggestedTime.toISOString(),
          available: false,
          conflicts: conflicts.map(c => c.showtimeId)
        });
      }
    }
    
    res.json({
      movieId,
      studioId,
      date: targetDate.toISOString(),
      suggestedTimes,
      existingShowtimes: existingShowtimes.map(s => ({
        id: s.showtimeId,
        showDateTime: s.showDateTime,
        movieId: s.movieId
      }))
    });
  } catch (error) {
    console.error('Error getting optimal showtimes:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to get optimal showtimes'
    });
  }
});

// Get studio schedule
router.get('/studio-schedule', (req, res) => {
  try {
    const { studioId, startDate, endDate } = req.query;
    
    if (!studioId || !startDate || !endDate) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Missing required parameters: studioId, startDate, endDate'
      });
    }
    
    const showtimes = readTable('Showtimes');
    const movies = readTable('Movies');
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    const schedule = showtimes.filter(showtime => {
      if (showtime.studioId != studioId) return false;
      const showtimeDate = new Date(showtime.showDateTime);
      return showtimeDate >= start && showtimeDate <= end;
    }).map(showtime => {
      const movie = movies.find(m => m.movieId == showtime.movieId);
      return {
        ...showtime,
        movie: movie ? { title: movie.title, duration: movie.duration } : null
      };
    });
    
    // Sort by showDateTime
    schedule.sort((a, b) => new Date(a.showDateTime) - new Date(b.showDateTime));
    
    res.json({
      studioId,
      startDate,
      endDate,
      schedule
    });
  } catch (error) {
    console.error('Error getting studio schedule:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to get studio schedule'
    });
  }
});

module.exports = router; 