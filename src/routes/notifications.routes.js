const express = require('express');
const router = express.Router();
const { readTable, writeTable } = require('../utils/jsonDb');
const { authenticate, isAdmin } = require('../middleware/auth');

// Apply authentication middleware to all routes
router.use(authenticate);

/**
 * @swagger
 * /api/notifications:
 *   get:
 *     summary: Get user's notifications
 *     tags:
 *       - Notifications
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of notifications per page
 *       - in: query
 *         name: unreadOnly
 *         schema:
 *           type: boolean
 *         description: Only unread notifications
 *     responses:
 *       200:
 *         description: List of notifications
 *       500:
 *         description: Failed to fetch notifications
 */

// Get user's notifications
router.get('/', (req, res) => {
  try {
    const { page = 1, limit = 10, unreadOnly = false } = req.query;
    const offset = (page - 1) * limit;
    
    let notifications = readTable('Notifications');
    
    // Filter by user ID
    notifications = notifications.filter(n => n.userId === req.user.userId);
    
    // Filter unread only if requested
    if (unreadOnly === 'true') {
      notifications = notifications.filter(n => !n.read);
    }
    
    // Sort by createdAt descending
    notifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    const total = notifications.length;
    const paginatedNotifications = notifications.slice(offset, offset + parseInt(limit));
    
    res.json({
      notifications: paginatedNotifications,
      total,
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch notifications'
    });
  }
});

// Get a notification by ID
router.get('/:id', (req, res) => {
  try {
    const notifications = readTable('Notifications');
    const notification = notifications.find(n => n.id === Number(req.params.id) && n.userId === req.user.userId);
    
    if (!notification) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Notification not found'
      });
    }
    
    res.json(notification);
  } catch (error) {
    console.error('Error fetching notification:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch notification'
    });
  }
});

// Create a new notification
router.post('/', (req, res) => {
  try {
    const notifications = readTable('Notifications');
    const newId = notifications.length ? Math.max(...notifications.map(n => n.id)) + 1 : 1;
    const newNotification = {
      ...req.body,
      id: newId,
      userId: req.user.userId,
      createdAt: new Date().toISOString(),
      read: false
    };
    
    notifications.push(newNotification);
    writeTable('Notifications', notifications);
    res.status(201).json(newNotification);
  } catch (error) {
    console.error('Error creating notification:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to create notification'
    });
  }
});

// Update a notification
router.put('/:id', (req, res) => {
  try {
    const notifications = readTable('Notifications');
    const idx = notifications.findIndex(n => n.id === Number(req.params.id) && n.userId === req.user.userId);
    
    if (idx === -1) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Notification not found'
      });
    }
    
    notifications[idx] = { ...notifications[idx], ...req.body };
    writeTable('Notifications', notifications);
    res.json(notifications[idx]);
  } catch (error) {
    console.error('Error updating notification:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to update notification'
    });
  }
});

// Mark notification as read
router.patch('/:id/read', (req, res) => {
  try {
    const notifications = readTable('Notifications');
    const idx = notifications.findIndex(n => n.id === Number(req.params.id) && n.userId === req.user.userId);
    
    if (idx === -1) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Notification not found'
      });
    }
    
    notifications[idx].read = true;
    writeTable('Notifications', notifications);
    res.json(notifications[idx]);
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to mark notification as read'
    });
  }
});

// Mark all notifications as read
router.patch('/read-all', (req, res) => {
  try {
    const notifications = readTable('Notifications');
    const updated = notifications.map(n => 
      n.userId === req.user.userId && !n.read ? { ...n, read: true } : n
    );
    
    writeTable('Notifications', updated);
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to mark all notifications as read'
    });
  }
});

// Delete a notification
router.delete('/:id', (req, res) => {
  try {
    let notifications = readTable('Notifications');
    const idx = notifications.findIndex(n => n.id === Number(req.params.id) && n.userId === req.user.userId);
    
    if (idx === -1) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Notification not found'
      });
    }
    
    const deleted = notifications.splice(idx, 1)[0];
    writeTable('Notifications', notifications);
    res.json({ message: 'Notification deleted successfully', deleted });
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
router.get('/admin', (req, res) => {
  try {
    const { page = 1, limit = 10, userId, type } = req.query;
    const offset = (page - 1) * limit;
    
    let notifications = readTable('Notifications');
    
    // Apply filters
    if (userId) {
      notifications = notifications.filter(n => n.userId === userId);
    }
    if (type) {
      notifications = notifications.filter(n => n.type === type);
    }
    
    // Sort by createdAt descending
    notifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    const total = notifications.length;
    const paginatedNotifications = notifications.slice(offset, offset + parseInt(limit));
    
    res.json({
      notifications: paginatedNotifications,
      total,
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / limit)
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
router.post('/admin', (req, res) => {
  try {
    const { userId, type, title, message, data } = req.body;
    
    // Validate required fields
    if (!userId || !type || !title || !message) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'userId, type, title, and message are required'
      });
    }
    
    const notifications = readTable('Notifications');
    const newId = notifications.length ? Math.max(...notifications.map(n => n.id)) + 1 : 1;
    const newNotification = {
      id: newId,
      userId,
      type,
      title,
      message,
      data: data || {},
      read: false,
      createdAt: new Date().toISOString()
    };
    
    notifications.push(newNotification);
    writeTable('Notifications', notifications);
    res.status(201).json(newNotification);
  } catch (error) {
    console.error('Error creating admin notification:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to create notification'
    });
  }
});

// Update notification (admin only)
router.put('/admin/:id', (req, res) => {
  try {
    const notifications = readTable('Notifications');
    const idx = notifications.findIndex(n => n.id === Number(req.params.id));
    
    if (idx === -1) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Notification not found'
      });
    }
    
    notifications[idx] = { ...notifications[idx], ...req.body };
    writeTable('Notifications', notifications);
    res.json(notifications[idx]);
  } catch (error) {
    console.error('Error updating admin notification:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to update notification'
    });
  }
});

// Delete notification (admin only)
router.delete('/admin/:id', (req, res) => {
  try {
    let notifications = readTable('Notifications');
    const idx = notifications.findIndex(n => n.id === Number(req.params.id));
    
    if (idx === -1) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Notification not found'
      });
    }
    
    const deleted = notifications.splice(idx, 1)[0];
    writeTable('Notifications', notifications);
    res.json({ message: 'Notification deleted successfully', deleted });
  } catch (error) {
    console.error('Error deleting admin notification:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to delete notification'
    });
  }
});

module.exports = router; 