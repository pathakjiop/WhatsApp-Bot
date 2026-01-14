require('dotenv').config();

// Set default environment variables
process.env.NODE_ENV = process.env.NODE_ENV || 'development';
process.env.PORT = process.env.PORT || 3000;
process.env.BASE_URL = process.env.BASE_URL || `http://localhost:${process.env.PORT}`;

// Load WhatsApp config early to check
const whatsappConfig = require('./src/config/whatsapp.config');

console.log('🚀 Starting WhatsApp Bot Server');
console.log('='.repeat(50));
console.log(`Environment: ${process.env.NODE_ENV}`);
console.log(`Port: ${process.env.PORT}`);
console.log(`Base URL: ${process.env.BASE_URL}`);
console.log('='.repeat(50));

// Check for required configuration
if (!whatsappConfig.accessToken || whatsappConfig.accessToken === 'your_whatsapp_access_token_here') {
  console.warn('⚠️  WARNING: WhatsApp access token not configured.');
  console.warn('   The bot will run in simulation mode.');
  console.warn('   To connect to real WhatsApp, update your .env file.');
}

if (!process.env.RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID.includes('mock')) {
  console.warn('⚠️  WARNING: Razorpay credentials not configured.');
  console.warn('   Payments will run in test mode.');
  console.warn('   To enable real payments, add Razorpay credentials to .env');
}

const app = require('./src/app');
const { connectDB } = require('./src/config/database.config');
const logger = require('./src/utils/logger');

// Connect to database (will continue even if it fails in development)
connectDB();

// Add a test endpoint
app.get('/test/db', (req, res) => {
  const { inMemoryDB, useInMemoryDB } = require('./src/services/database.service');
  
  res.json({
    database: useInMemoryDB ? 'in-memory' : 'mongodb',
    stats: inMemoryDB.getStats(),
    status: 'ok',
  });
});

// Add a cleanup endpoint for testing
app.post('/test/clear', (req, res) => {
  if (process.env.NODE_ENV === 'development') {
    const { inMemoryDB } = require('./src/services/database.service');
    inMemoryDB.clear();
    res.json({ message: 'In-memory database cleared' });
  } else {
    res.status(403).json({ error: 'Not allowed in production' });
  }
});

const PORT = process.env.PORT;

app.listen(PORT, () => {
  logger.info(`Server is running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV}`);
  logger.info(`Base URL: ${process.env.BASE_URL || `http://localhost:${PORT}`}`);
  
  console.log('\n📋 Available endpoints:');
  console.log(`  GET  ${process.env.BASE_URL}/health`);
  console.log(`  GET  ${process.env.BASE_URL}/test/db`);
  console.log(`  POST ${process.env.BASE_URL}/test/clear (dev only)`);
  console.log(`  GET  ${process.env.BASE_URL}/webhook`);
  console.log(`  POST ${process.env.BASE_URL}/webhook`);
  console.log(`  GET  ${process.env.BASE_URL}/payment/success`);
  console.log(`  GET  ${process.env.BASE_URL}/payment/failure`);
  
  console.log('\n🎮 Quick Test Commands:');
  console.log('1. Test health:');
  console.log(`   curl ${process.env.BASE_URL}/health`);
  
  console.log('\n2. Test database:');
  console.log(`   curl ${process.env.BASE_URL}/test/db`);
  
  console.log('\n3. Simulate user sending "hi":');
  console.log(`   curl -X POST ${process.env.BASE_URL}/webhook \\`);
  console.log('     -H "Content-Type: application/json" \\');
  console.log('     -d \'{"object":"whatsapp_business_account","entry":[{"id":"test","changes":[{"value":{"messaging_product":"whatsapp","metadata":{"display_phone_number":"1234567890","phone_number_id":"test"},"contacts":[{"profile":{"name":"Test"},"wa_id":"919876543210"}],"messages":[{"from":"919876543210","id":"test","timestamp":"123","type":"text","text":{"body":"hi"}}]}}]}]}\'');
  
  console.log('\n✅ Server is ready!');
});