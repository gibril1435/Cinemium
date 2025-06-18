const promotionRoutes = require('./routes/promotionRoutes');
const ticketRoutes = require('./routes/ticketRoutes');

// Routes
app.use('/api/promotions', promotionRoutes);
app.use('/api/transactions', ticketRoutes); 