const express = require('express');
const cors = require('cors');
const webhookRoutes = require('./routes/webhook.routes');
const paymentRoutes = require('./routes/payment.routes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/webhook', webhookRoutes);
app.use('/payment', paymentRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'WhatsApp Bot'
  });
});

// Test endpoints
app.get('/test/data', (req, res) => {
  const db = require('./services/database.service');
  res.json({
    users: db.getUsers(),
    orders: db.getOrders(),
    stats: db.getStats()
  });
});

app.post('/test/clear', (req, res) => {
  if (process.env.NODE_ENV !== 'development') {
    return res.status(403).json({ error: 'Only in development' });
  }
  
  const db = require('./services/database.service');
  db.clearAll();
  
  res.json({
    message: 'Test data cleared',
    stats: db.getStats()
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Cannot ${req.method} ${req.url}`
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message
  });
});

module.exports = app;