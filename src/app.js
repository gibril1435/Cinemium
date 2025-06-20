const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Import routes
const authRoutes = require('./routes/auth.routes');
const moviesRoutes = require('./routes/movies.routes');
const bookingRoutes = require('./routes/booking.routes');
const adminRoutes = require('./routes/admin.routes');
const addonsRoutes = require('./routes/addons.routes');
const studiosRoutes = require('./routes/studios.routes');
const notificationsRoutes = require('./routes/notifications.routes');
const ticketPriceRoutes = require('./routes/ticketPrice.routes');
const scheduleManagementRoutes = require('./routes/scheduleManagement.routes');
const promotionController = require('./controllers/promotionController');
const adminPromotionRoutes = require('./routes/admin/promotions.routes');
const addOnSalesRoutes = require('./routes/admin/addOnSales.routes');

// Import tasks
const { scheduleCleanup } = require('./tasks/notificationCleanup.task');
const { toCamelCaseDeep } = require('./utils/caseUtils');

const app = express();

// Middleware
app.use(helmet()); // Security headers
app.use(cors({
  origin: 'http://localhost:3000', // or use your frontend URL
  credentials: true
})); // Enable CORS
app.use(morgan('dev')); // Logging
app.use(express.json()); // Parse JSON bodies

// Swagger setup
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Cinemium API',
      version: '1.0.0',
      description: 'API documentation for Cinemium backend',
    },
    servers: [
      { url: `http://localhost:${process.env.PORT || 3000}` }
    ],
  },
  apis: ['./src/routes/*.js', './src/routes/admin/*.js'], // You can add more paths if needed
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/movies', moviesRoutes);
app.use('/api/promotions', (req, res, next) => {
  if (req.method === 'GET' && req.path === '/') {
    return promotionController.getActivePromotions(req, res, next);
  }
  if (req.method === 'GET') {
    return promotionController.getPromotionById(req, res, next);
  }
  next();
});
app.use('/api/admin/promotions', adminPromotionRoutes);
app.use('/api/booking', bookingRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/addons', addonsRoutes);
app.use('/api/admin/studios', studiosRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/admin/prices', ticketPriceRoutes);
app.use('/api/admin/schedule', scheduleManagementRoutes);
app.use('/api/admin/addon-sales', addOnSalesRoutes);

// Middleware to enforce camelCase on all outgoing JSON responses
app.use((req, res, next) => {
  const originalJson = res.json;
  res.json = function (data) {
    return originalJson.call(this, toCamelCaseDeep(data));
  };
  next();
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        message: 'Internal Server Error',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        message: 'Not Found'
    });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    // Start the notification cleanup task
    scheduleCleanup();
});

module.exports = app; 