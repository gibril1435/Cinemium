const jwt = require('jsonwebtoken');
const { readTable } = require('../utils/jsonDb');

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

// Middleware to authenticate user
function authenticate(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'No token provided' });
    }
    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Invalid token' });
    }
}

// Middleware to check if user is admin
function isAdmin(req, res, next) {
    console.log('isAdmin middleware: req.user =', req.user);
    const users = readTable('Users');
    const user = users.find(u => u.userId === req.user.userId);
    console.log('isAdmin middleware: matched user =', user);
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    if (!user || user.role !== 'admin') {
        return res.status(403).json({ error: 'Forbidden: Admins only' });
    }
    next();
}

module.exports = { authenticate, isAdmin }; 