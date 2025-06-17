const { Showtime, Movie, Studio } = require('../models');
const { Op } = require('sequelize');
const { addMinutes, isBefore, isAfter, parseISO } = require('date-fns');

class ScheduleManagementService {
    async checkStudioAvailability(studioId, startTime, endTime, excludeShowtimeId = null) {
        try {
            const whereClause = {
                studioId,
                [Op.or]: [
                    // Check if new showtime overlaps with existing showtimes
                    {
                        showDateTime: {
                            [Op.between]: [startTime, endTime]
                        }
                    },
                    {
                        [Op.and]: [
                            {
                                showDateTime: {
                                    [Op.lte]: startTime
                                }
                            },
                            {
                                endDateTime: {
                                    [Op.gte]: startTime
                                }
                            }
                        ]
                    }
                ]
            };

            // Exclude current showtime when updating
            if (excludeShowtimeId) {
                whereClause.id = {
                    [Op.ne]: excludeShowtimeId
                };
            }

            const conflictingShowtimes = await Showtime.findAll({
                where: whereClause,
                include: [{
                    model: Movie,
                    attributes: ['title', 'duration']
                }]
            });

            return {
                isAvailable: conflictingShowtimes.length === 0,
                conflicts: conflictingShowtimes.map(st => ({
                    id: st.id,
                    movieTitle: st.Movie.title,
                    startTime: st.showDateTime,
                    endTime: st.endDateTime
                }))
            };
        } catch (error) {
            console.error('Error checking studio availability:', error);
            throw error;
        }
    }

    async createShowtime(movieId, studioId, showDateTime) {
        try {
            // Get movie duration
            const movie = await Movie.findByPk(movieId);
            if (!movie) {
                throw new Error('Movie not found');
            }

            // Calculate end time (showtime + duration + 30 minutes cleaning time)
            const endDateTime = addMinutes(showDateTime, movie.duration + 30);

            // Check studio availability
            const availability = await this.checkStudioAvailability(
                studioId,
                showDateTime,
                endDateTime
            );

            if (!availability.isAvailable) {
                throw new Error('Studio is not available at the specified time');
            }

            // Create showtime
            const showtime = await Showtime.create({
                movieId,
                studioId,
                showDateTime,
                endDateTime
            });

            return showtime;
        } catch (error) {
            console.error('Error creating showtime:', error);
            throw error;
        }
    }

    async updateShowtime(showtimeId, newShowDateTime) {
        try {
            const showtime = await Showtime.findByPk(showtimeId, {
                include: [{
                    model: Movie,
                    attributes: ['duration']
                }]
            });

            if (!showtime) {
                throw new Error('Showtime not found');
            }

            // Calculate new end time
            const newEndDateTime = addMinutes(newShowDateTime, showtime.Movie.duration + 30);

            // Check studio availability
            const availability = await this.checkStudioAvailability(
                showtime.studioId,
                newShowDateTime,
                newEndDateTime,
                showtimeId
            );

            if (!availability.isAvailable) {
                throw new Error('Studio is not available at the specified time');
            }

            // Update showtime
            await showtime.update({
                showDateTime: newShowDateTime,
                endDateTime: newEndDateTime
            });

            return showtime;
        } catch (error) {
            console.error('Error updating showtime:', error);
            throw error;
        }
    }

    async getOptimalShowtimes(movieId, studioId, date) {
        try {
            const movie = await Movie.findByPk(movieId);
            if (!movie) {
                throw new Error('Movie not found');
            }

            const studio = await Studio.findByPk(studioId);
            if (!studio) {
                throw new Error('Studio not found');
            }

            // Get all showtimes for the studio on the specified date
            const startOfDay = new Date(date);
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(date);
            endOfDay.setHours(23, 59, 59, 999);

            const existingShowtimes = await Showtime.findAll({
                where: {
                    studioId,
                    showDateTime: {
                        [Op.between]: [startOfDay, endOfDay]
                    }
                },
                order: [['showDateTime', 'ASC']]
            });

            // Calculate optimal showtimes
            const movieDuration = movie.duration + 30; // Including cleaning time
            const optimalShowtimes = [];
            let currentTime = new Date(date);
            currentTime.setHours(9, 0, 0, 0); // Start at 9 AM
            const endTime = new Date(date);
            endTime.setHours(22, 0, 0, 0); // End at 10 PM

            while (isBefore(currentTime, endTime)) {
                const potentialEndTime = addMinutes(currentTime, movieDuration);
                
                // Check if this time slot is available
                const isAvailable = !existingShowtimes.some(st => {
                    const stStart = parseISO(st.showDateTime);
                    const stEnd = parseISO(st.endDateTime);
                    return (
                        (isAfter(currentTime, stStart) && isBefore(currentTime, stEnd)) ||
                        (isAfter(potentialEndTime, stStart) && isBefore(potentialEndTime, stEnd))
                    );
                });

                if (isAvailable) {
                    optimalShowtimes.push({
                        startTime: new Date(currentTime),
                        endTime: potentialEndTime
                    });
                }

                // Move to next potential time slot (every 30 minutes)
                currentTime = addMinutes(currentTime, 30);
            }

            return optimalShowtimes;
        } catch (error) {
            console.error('Error getting optimal showtimes:', error);
            throw error;
        }
    }

    async getStudioSchedule(studioId, startDate, endDate) {
        try {
            const schedule = await Showtime.findAll({
                where: {
                    studioId,
                    showDateTime: {
                        [Op.between]: [startDate, endDate]
                    }
                },
                include: [{
                    model: Movie,
                    attributes: ['title', 'duration']
                }],
                order: [['showDateTime', 'ASC']]
            });

            return schedule.map(st => ({
                id: st.id,
                movieTitle: st.Movie.title,
                startTime: st.showDateTime,
                endTime: st.endDateTime,
                duration: st.Movie.duration
            }));
        } catch (error) {
            console.error('Error getting studio schedule:', error);
            throw error;
        }
    }
}

module.exports = new ScheduleManagementService(); 