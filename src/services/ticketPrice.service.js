const { TicketPrice } = require('../models');
const { Op } = require('sequelize');
const { isWeekend, isHoliday } = require('date-fns');

class TicketPriceService {
    async getPriceForDate(date) {
        try {
            // First, check for specific date range custom prices
            const customPrice = await TicketPrice.findOne({
                where: {
                    type: 'custom',
                    startDate: {
                        [Op.lte]: date
                    },
                    endDate: {
                        [Op.gte]: date
                    }
                }
            });

            if (customPrice) {
                return customPrice.price;
            }

            // Check for day of week specific prices
            const dayOfWeek = date.getDay();
            const dayPrice = await TicketPrice.findOne({
                where: {
                    type: 'custom',
                    dayOfWeek: dayOfWeek
                }
            });

            if (dayPrice) {
                return dayPrice.price;
            }

            // Check for holiday prices
            if (isHoliday(date)) {
                const holidayPrice = await TicketPrice.findOne({
                    where: {
                        type: 'custom',
                        isHoliday: true
                    }
                });

                if (holidayPrice) {
                    return holidayPrice.price;
                }
            }

            // Check for weekend prices
            if (isWeekend(date)) {
                const weekendPrice = await TicketPrice.findOne({
                    where: {
                        type: 'custom',
                        dayOfWeek: dayOfWeek,
                        description: 'weekend'
                    }
                });

                if (weekendPrice) {
                    return weekendPrice.price;
                }
            }

            // Return default price if no custom price is found
            const defaultPrice = await TicketPrice.findOne({
                where: {
                    type: 'default'
                }
            });

            return defaultPrice ? defaultPrice.price : null;
        } catch (error) {
            console.error('Error getting ticket price:', error);
            throw error;
        }
    }

    async setDefaultPrice(price) {
        try {
            const [defaultPrice, created] = await TicketPrice.findOrCreate({
                where: { type: 'default' },
                defaults: { price }
            });

            if (!created) {
                await defaultPrice.update({ price });
            }

            return defaultPrice;
        } catch (error) {
            console.error('Error setting default price:', error);
            throw error;
        }
    }

    async setCustomPrice({ price, startDate, endDate, dayOfWeek, isHoliday, description }) {
        try {
            // Validate date range if provided
            if (startDate && endDate && new Date(startDate) >= new Date(endDate)) {
                throw new Error('Start date must be before end date');
            }

            const customPrice = await TicketPrice.create({
                type: 'custom',
                price,
                startDate,
                endDate,
                dayOfWeek,
                isHoliday,
                description
            });

            return customPrice;
        } catch (error) {
            console.error('Error setting custom price:', error);
            throw error;
        }
    }

    async getPriceHistory(startDate, endDate) {
        try {
            const prices = await TicketPrice.findAll({
                where: {
                    [Op.or]: [
                        {
                            startDate: {
                                [Op.between]: [startDate, endDate]
                            }
                        },
                        {
                            endDate: {
                                [Op.between]: [startDate, endDate]
                            }
                        }
                    ]
                },
                order: [['createdAt', 'DESC']]
            });

            return prices;
        } catch (error) {
            console.error('Error getting price history:', error);
            throw error;
        }
    }

    async deleteCustomPrice(id) {
        try {
            const price = await TicketPrice.findOne({
                where: {
                    id,
                    type: 'custom'
                }
            });

            if (!price) {
                throw new Error('Custom price not found');
            }

            await price.destroy();
            return true;
        } catch (error) {
            console.error('Error deleting custom price:', error);
            throw error;
        }
    }
}

module.exports = new TicketPriceService(); 