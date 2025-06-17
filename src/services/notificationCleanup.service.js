const { Notification } = require('../models');
const { Op } = require('sequelize');
const { subDays, subMonths } = require('date-fns');

class NotificationCleanupService {
    constructor() {
        // Define retention periods for different notification types (in days)
        this.retentionPeriods = {
            booking: 30,    // Keep booking notifications for 30 days
            payment: 90,    // Keep payment notifications for 90 days
            system: 7,      // Keep system notifications for 7 days
            promo: 14,      // Keep promo notifications for 14 days
            maintenance: 30 // Keep maintenance notifications for 30 days
        };
    }

    async cleanup() {
        try {
            const results = {
                totalDeleted: 0,
                deletedByType: {}
            };

            // Process each notification type
            for (const [type, retentionDays] of Object.entries(this.retentionPeriods)) {
                const cutoffDate = subDays(new Date(), retentionDays);
                
                const deleted = await Notification.destroy({
                    where: {
                        type,
                        createdAt: {
                            [Op.lt]: cutoffDate
                        },
                        read: true // Only delete read notifications
                    }
                });

                results.deletedByType[type] = deleted;
                results.totalDeleted += deleted;
            }

            // Log cleanup results
            console.log('Notification cleanup completed:', {
                timestamp: new Date().toISOString(),
                ...results
            });

            return results;
        } catch (error) {
            console.error('Error during notification cleanup:', error);
            throw error;
        }
    }

    async getCleanupStats() {
        try {
            const stats = {
                total: 0,
                byType: {},
                byAge: {
                    '0-7 days': 0,
                    '8-30 days': 0,
                    '31-90 days': 0,
                    '90+ days': 0
                }
            };

            // Get counts by type
            for (const type of Object.keys(this.retentionPeriods)) {
                const count = await Notification.count({
                    where: { type }
                });
                stats.byType[type] = count;
                stats.total += count;
            }

            // Get counts by age
            const now = new Date();
            const sevenDaysAgo = subDays(now, 7);
            const thirtyDaysAgo = subDays(now, 30);
            const ninetyDaysAgo = subDays(now, 90);

            stats.byAge['0-7 days'] = await Notification.count({
                where: {
                    createdAt: {
                        [Op.gte]: sevenDaysAgo
                    }
                }
            });

            stats.byAge['8-30 days'] = await Notification.count({
                where: {
                    createdAt: {
                        [Op.lt]: sevenDaysAgo,
                        [Op.gte]: thirtyDaysAgo
                    }
                }
            });

            stats.byAge['31-90 days'] = await Notification.count({
                where: {
                    createdAt: {
                        [Op.lt]: thirtyDaysAgo,
                        [Op.gte]: ninetyDaysAgo
                    }
                }
            });

            stats.byAge['90+ days'] = await Notification.count({
                where: {
                    createdAt: {
                        [Op.lt]: ninetyDaysAgo
                    }
                }
            });

            return stats;
        } catch (error) {
            console.error('Error getting cleanup stats:', error);
            throw error;
        }
    }

    async archiveOldNotifications() {
        try {
            const archiveDate = subMonths(new Date(), 3); // Archive notifications older than 3 months
            
            // Get notifications to archive
            const notifications = await Notification.findAll({
                where: {
                    createdAt: {
                        [Op.lt]: archiveDate
                    },
                    read: true
                }
            });

            // Here you would implement the actual archiving logic
            // For example, you could:
            // 1. Export to a JSON file
            // 2. Store in a separate archive table
            // 3. Move to a cold storage solution
            
            // For now, we'll just log the number of notifications that would be archived
            console.log(`Found ${notifications.length} notifications to archive`);

            return {
                archivedCount: notifications.length,
                archiveDate: archiveDate
            };
        } catch (error) {
            console.error('Error archiving old notifications:', error);
            throw error;
        }
    }
}

module.exports = new NotificationCleanupService(); 