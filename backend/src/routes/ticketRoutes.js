const express = require('express');
const router = express.Router();
const ticketController = require('../controllers/ticketController');
const { authenticate } = require('../middleware/auth');

// Generate PDF ticket
router.get('/:id/ticket-pdf', authenticate, ticketController.generateTicketPDF);

module.exports = router; 