const jwt = require('jsonwebtoken');
const { User } = require('../models');

// Middleware to authenticate user
const authenticate = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({
                error: 'Unauthorized',
                message: 'Authentication required'
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findByPk(decoded.userId);

        if (!user) {
            return res.status(401).json({
                error: 'Unauthorized',
                message: 'User not found'
            });
        }

        req.user = {
            userId: user.id,
            username: user.username
        };

        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                error: 'Unauthorized',
                message: 'Invalid token'
            });
        }

        console.error('Authentication error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Authentication failed'
        });
    }
};

// Middleware to check if user is admin
const isAdmin = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({
                error: 'Unauthorized',
                message: 'Authentication required'
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findByPk(decoded.userId);

        if (!user) {
            return res.status(401).json({
                error: 'Unauthorized',
                message: 'User not found'
            });
        }

        if (!user.isAdmin) {
            return res.status(403).json({
                error: 'Forbidden',
                message: 'Insufficient permissions'
            });
        }

        req.user = {
            userId: user.id,
            username: user.username
        };

        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                error: 'Unauthorized',
                message: 'Invalid token'
            });
        }

        console.error('Admin authorization error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Authorization failed'
        });
    }
};

module.exports = {
    authenticate,
    isAdmin
}; 