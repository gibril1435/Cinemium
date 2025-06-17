const express = require('express');
const router = express.Router();
const { Notification, User, Transaction, Ticket } = require('../models');
const { authenticate, isAdmin } = require('../middleware/auth');
const { Op } = require('sequelize');

// Apply authentication middleware to all routes
router.use(authenticate);

// Get user's notifications
router.get('/', async (req, res) => {
    try {
        const { page = 1, limit = 10, unreadOnly = false } = req.query;
        const offset = (page - 1) * limit;

        const whereClause = {
            userId: req.user.id
        };

        if (unreadOnly === 'true') {
            whereClause.read = false;
        }

        const notifications = await Notification.findAndCountAll({
            where: whereClause,
            order: [['createdAt', 'DESC']],
            limit: parseInt(limit),
            offset: parseInt(offset)
        });

        res.json({
            notifications: notifications.rows,
            total: notifications.count,
            currentPage: parseInt(page),
            totalPages: Math.ceil(notifications.count / limit)
        });
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to fetch notifications'
        });
    }
});

// Mark notification as read
router.patch('/:id/read', async (req, res) => {
    try {
        const notification = await Notification.findOne({
            where: {
                id: req.params.id,
                userId: req.user.id
            }
        });

        if (!notification) {
            return res.status(404).json({
                error: 'Not Found',
                message: 'Notification not found'
            });
        }

        await notification.update({ read: true });
        res.json(notification);
    } catch (error) {
        console.error('Error marking notification as read:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to mark notification as read'
        });
    }
});

// Mark all notifications as read
router.patch('/read-all', async (req, res) => {
    try {
        await Notification.update(
            { read: true },
            {
                where: {
                    userId: req.user.id,
                    read: false
                }
            }
        );

        res.json({ message: 'All notifications marked as read' });
    } catch (error) {
        console.error('Error marking all notifications as read:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to mark all notifications as read'
        });
    }
});

// Delete notification
router.delete('/:id', async (req, res) => {
    try {
        const notification = await Notification.findOne({
            where: {
                id: req.params.id,
                userId: req.user.id
            }
        });

        if (!notification) {
            return res.status(404).json({
                error: 'Not Found',
                message: 'Notification not found'
            });
        }

        await notification.destroy();
        res.json({ message: 'Notification deleted successfully' });
    } catch (error) {
        console.error('Error deleting notification:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to delete notification'
        });
    }
});

// Admin routes
router.use('/admin', isAdmin);

// Get all notifications (admin only)
router.get('/admin', async (req, res) => {
    try {
        const { page = 1, limit = 10, userId, type } = req.query;
        const offset = (page - 1) * limit;

        const whereClause = {};
        if (userId) whereClause.userId = userId;
        if (type) whereClause.type = type;

        const notifications = await Notification.findAndCountAll({
            where: whereClause,
            include: [{ model: User, attributes: ['username', 'email'] }],
            order: [['createdAt', 'DESC']],
            limit: parseInt(limit),
            offset: parseInt(offset)
        });

        res.json({
            notifications: notifications.rows,
            total: notifications.count,
            currentPage: parseInt(page),
            totalPages: Math.ceil(notifications.count / limit)
        });
    } catch (error) {
        console.error('Error fetching all notifications:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to fetch all notifications'
        });
    }
});

// Create notification (admin only)
router.post('/admin', async (req, res) => {
    try {
        const { userId, type, title, message, data } = req.body;

        // Validate required fields
        if (!userId || !type || !title || !message) {
            return res.status(400).json({
                error: 'Validation Error',
                message: 'userId, type, title, and message are required'
            });
        }

        // Check if user exists
        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({
                error: 'Not Found',
                message: 'User not found'
            });
        }

        const notification = await Notification.create({
            userId,
            type,
            title,
            message,
            data: data || {}
        });

        res.status(201).json(notification);
    } catch (error) {
        console.error('Error creating notification:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to create notification'
        });
    }
});

// Create bulk notifications (admin only)
router.post('/admin/bulk', async (req, res) => {
    try {
        const { notifications } = req.body;

        if (!Array.isArray(notifications)) {
            return res.status(400).json({
                error: 'Validation Error',
                message: 'notifications must be an array'
            });
        }

        // Validate each notification
        for (const notification of notifications) {
            if (!notification.userId || !notification.type || !notification.title || !notification.message) {
                return res.status(400).json({
                    error: 'Validation Error',
                    message: 'Each notification must have userId, type, title, and message'
                });
            }
        }

        // Check if all users exist
        const userIds = [...new Set(notifications.map(n => n.userId))];
        const users = await User.findAll({
            where: { id: { [Op.in]: userIds } }
        });

        if (users.length !== userIds.length) {
            return res.status(404).json({
                error: 'Not Found',
                message: 'One or more users not found'
            });
        }

        const createdNotifications = await Notification.bulkCreate(
            notifications.map(n => ({
                ...n,
                data: n.data || {}
            }))
        );

        res.status(201).json({ notifications: createdNotifications });
    } catch (error) {
        console.error('Error creating bulk notifications:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to create bulk notifications'
        });
    }
});

module.exports = router; 