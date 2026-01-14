const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { connectDB } = require('./config/database.config');
const webhookRoutes = require('./routes/webhook.routes');
const paymentRoutes = require('./routes/payment.routes');
const { errorHandler, notFoundHandler } = require('./middlewares/error.middleware');
const logger = require('./utils/logger');

const app = express();

// Connect to database
connectDB();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Import test routes (only in development)
if (process.env.NODE_ENV === 'development') {
  const testRoutes = require('./routes/test.routes');
  app.use('/test', testRoutes);
}

// Logging
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));

// Routes
app.use('/webhook', webhookRoutes);
app.use('/payment', paymentRoutes);

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'WhatsApp Bot Service'
  });
});

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;