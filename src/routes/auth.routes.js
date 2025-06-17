const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { User } = require('../models');

// Register new user
router.post('/register', async (req, res) => {
    try {
        const { username, password } = req.body;

        // Check if username already exists
        const existingUser = await User.findOne({ where: { username } });
        if (existingUser) {
            return res.status(400).json({
                error: 'Validation Error',
                message: 'Username already exists'
            });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create user
        await User.create({
            username,
            passwordHash: hashedPassword
        });

        res.status(201).json({
            message: 'Account created successfully',
            redirect: '/login'
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to create account'
        });
    }
});

// User login
router.post('/login', async (req, res) => {
    try {
        const { username, password, source } = req.body;

        // Find user
        const user = await User.findOne({ where: { username } });
        if (!user) {
            return res.status(401).json({
                error: 'Authentication Error',
                message: 'Invalid credentials'
            });
        }

        // Verify password
        const validPassword = await bcrypt.compare(password, user.passwordHash);
        if (!validPassword) {
            return res.status(401).json({
                error: 'Authentication Error',
                message: 'Invalid credentials'
            });
        }

        // Update last login
        await user.update({ lastLoginAt: new Date() });

        // Generate JWT token
        const token = jwt.sign(
            { userId: user.id, username: user.username },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        // Determine redirect path based on source
        let redirectPath = '/home';
        if (source === 'movie') {
            redirectPath = `/movie/${req.query.movieId}`;
        } else if (source === 'seat') {
            redirectPath = `/seat/${req.query.showtimeId}`;
        }

        res.json({
            token,
            redirect: redirectPath
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to authenticate'
        });
    }
});

module.exports = router; 