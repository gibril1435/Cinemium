const { readTable, writeTable } = require('../utils/jsonDb');
// Implement file-based schedule management logic or remove this file if not used.

class ScheduleManagementService {
    checkStudioAvailability(studioId, startTime, endTime, excludeShowtimeId = null) {
        try {
            const showtimes = readTable('Showtimes');
            
            const conflictingShowtimes = showtimes.filter(st => {
                // Skip if this is the showtime we're excluding (for updates)
                if (excludeShowtimeId && st.showtimeId == excludeShowtimeId) {
                    return false;
                }
                
                // Check if studio matches
                if (st.studioId != studioId) {
                    return false;
                }
                
                const stStart = new Date(st.showDateTime);
                const stEnd = new Date(st.endDateTime || st.showDateTime);
                const newStart = new Date(startTime);
                const newEnd = new Date(endTime);
                
                // Check for overlap
                return (stStart < newEnd && stEnd > newStart);
            });

            return {
                isAvailable: conflictingShowtimes.length === 0,
                conflicts: conflictingShowtimes.map(st => ({
                    id: st.showtimeId,
                    movieTitle: st.movieTitle || 'Unknown Movie',
                    startTime: st.showDateTime,
                    endTime: st.endDateTime || st.showDateTime
                }))
            };
        } catch (error) {
            console.error('Error checking studio availability:', error);
            throw error;
        }
    }

    createShowtime(movieId, studioId, showDateTime) {
        try {
            // Get movie duration
            const movies = readTable('Movies');
            const movie = movies.find(m => m.movieId == movieId);
            if (!movie) {
                throw new Error('Movie not found');
            }

            // Calculate end time (showtime + duration + 30 minutes cleaning time)
            const endDateTime = new Date(showDateTime);
            endDateTime.setMinutes(endDateTime.getMinutes() + (movie.duration || 120) + 30);

            // Check studio availability
            const availability = this.checkStudioAvailability(
                studioId,
                showDateTime,
                endDateTime
            );

            if (!availability.isAvailable) {
                throw new Error('Studio is not available at the specified time');
            }

            // Create showtime
            const showtimes = readTable('Showtimes');
            const newId = showtimes.length ? Math.max(...showtimes.map(s => s.showtimeId)) + 1 : 1;
            const newShowtime = {
                showtimeId: newId,
                movieId: movieId,
                studioId: studioId,
                showDateTime: showDateTime,
                endDateTime: endDateTime,
                price: 50000, // Default price
                isActive: true
            };
            
            showtimes.push(newShowtime);
            writeTable('Showtimes', showtimes);

            return newShowtime;
        } catch (error) {
            console.error('Error creating showtime:', error);
            throw error;
        }
    }

    updateShowtime(showtimeId, newShowDateTime) {
        try {
            const showtimes = readTable('Showtimes');
            const showtime = showtimes.find(s => s.showtimeId == showtimeId);
            
            if (!showtime) {
                throw new Error('Showtime not found');
            }

            // Get movie duration
            const movies = readTable('Movies');
            const movie = movies.find(m => m.movieId == showtime.movieId);
            if (!movie) {
                throw new Error('Movie not found');
            }

            // Calculate new end time
            const newEndDateTime = new Date(newShowDateTime);
            newEndDateTime.setMinutes(newEndDateTime.getMinutes() + (movie.duration || 120) + 30);

            // Check studio availability
            const availability = this.checkStudioAvailability(
                showtime.studioId,
                newShowDateTime,
                newEndDateTime,
                showtimeId
            );

            if (!availability.isAvailable) {
                throw new Error('Studio is not available at the specified time');
            }

            // Update showtime
            const updatedShowtime = {
                ...showtime,
                showDateTime: newShowDateTime,
                endDateTime: newEndDateTime
            };
            
            const updatedShowtimes = showtimes.map(s => 
                s.showtimeId == showtimeId ? updatedShowtime : s
            );
            writeTable('Showtimes', updatedShowtimes);

            return updatedShowtime;
        } catch (error) {
            console.error('Error updating showtime:', error);
            throw error;
        }
    }

    getOptimalShowtimes(movieId, studioId, date) {
        try {
            const movies = readTable('Movies');
            const movie = movies.find(m => m.movieId == movieId);
            if (!movie) {
                throw new Error('Movie not found');
            }

            const studios = readTable('Studios');
            const studio = studios.find(s => s.studioId == studioId);
            if (!studio) {
                throw new Error('Studio not found');
            }

            // Get all showtimes for the studio on the specified date
            const showtimes = readTable('Showtimes');
            const startOfDay = new Date(date);
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(date);
            endOfDay.setHours(23, 59, 59, 999);

            const existingShowtimes = showtimes.filter(st => {
                if (st.studioId != studioId) return false;
                const stDate = new Date(st.showDateTime);
                return stDate >= startOfDay && stDate <= endOfDay;
            }).sort((a, b) => new Date(a.showDateTime) - new Date(b.showDateTime));

            // Calculate optimal showtimes
            const movieDuration = (movie.duration || 120) + 30; // Including cleaning time
            const optimalShowtimes = [];
            let currentTime = new Date(date);
            currentTime.setHours(9, 0, 0, 0); // Start at 9 AM
            const endTime = new Date(date);
            endTime.setHours(22, 0, 0, 0); // End at 10 PM

            while (currentTime < endTime) {
                const potentialEndTime = new Date(currentTime);
                potentialEndTime.setMinutes(potentialEndTime.getMinutes() + movieDuration);
                
                // Check if this time slot is available
                const isAvailable = !existingShowtimes.some(st => {
                    const stStart = new Date(st.showDateTime);
                    const stEnd = new Date(st.endDateTime || st.showDateTime);
                    return (
                        (currentTime >= stStart && currentTime < stEnd) ||
                        (potentialEndTime > stStart && potentialEndTime <= stEnd)
                    );
                });

                if (isAvailable) {
                    optimalShowtimes.push({
                        startTime: new Date(currentTime),
                        endTime: potentialEndTime
                    });
                }

                // Move to next potential time slot (every 30 minutes)
                currentTime.setMinutes(currentTime.getMinutes() + 30);
            }

            return optimalShowtimes;
        } catch (error) {
            console.error('Error getting optimal showtimes:', error);
            throw error;
        }
    }

    getStudioSchedule(studioId, startDate, endDate) {
        try {
            const showtimes = readTable('Showtimes');
            const movies = readTable('Movies');
            
            const schedule = showtimes
                .filter(st => st.studioId == studioId)
                .filter(st => {
                    const stDate = new Date(st.showDateTime);
                    return stDate >= new Date(startDate) && stDate <= new Date(endDate);
                })
                .map(st => {
                    const movie = movies.find(m => m.movieId == st.movieId);
                    return {
                        id: st.showtimeId,
                        movieTitle: movie ? movie.title : 'Unknown Movie',
                        showDateTime: st.showDateTime,
                        endDateTime: st.endDateTime || st.showDateTime,
                        price: st.price,
                        isActive: st.isActive
                    };
                })
                .sort((a, b) => new Date(a.showDateTime) - new Date(b.showDateTime));

            return schedule;
        } catch (error) {
            console.error('Error getting studio schedule:', error);
            throw error;
        }
    }
}

module.exports = new ScheduleManagementService(); 