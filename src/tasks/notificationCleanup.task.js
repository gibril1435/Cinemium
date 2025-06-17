const cron = require('node-cron');
const notificationCleanupService = require('../services/notificationCleanup.service');

// Run cleanup task every day at 2 AM
const scheduleCleanup = () => {
    cron.schedule('0 2 * * *', async () => {
        try {
            console.log('Starting scheduled notification cleanup...');
            
            // Get cleanup stats before running cleanup
            const beforeStats = await notificationCleanupService.getCleanupStats();
            console.log('Before cleanup stats:', beforeStats);

            // Run cleanup
            const cleanupResults = await notificationCleanupService.cleanup();
            console.log('Cleanup results:', cleanupResults);

            // Get cleanup stats after running cleanup
            const afterStats = await notificationCleanupService.getCleanupStats();
            console.log('After cleanup stats:', afterStats);

            // Archive old notifications
            const archiveResults = await notificationCleanupService.archiveOldNotifications();
            console.log('Archive results:', archiveResults);

            console.log('Scheduled notification cleanup completed successfully');
        } catch (error) {
            console.error('Error in scheduled notification cleanup:', error);
        }
    });
};

module.exports = {
    scheduleCleanup
}; 