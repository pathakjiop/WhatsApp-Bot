require('dotenv').config();
const app = require('./src/app');

const PORT = process.env.PORT || 3000;

console.log('🚀 WhatsApp Bot Starting...');
console.log('='.repeat(50));
console.log(`Environment: ${process.env.NODE_ENV}`);
console.log(`Port: ${PORT}`);
console.log(`Base URL: ${process.env.BASE_URL}`);
console.log('='.repeat(50));

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log('\n📋 Available Endpoints:');
  console.log(`  GET  /health - Health check`);
  console.log(`  GET  /webhook - Webhook verification`);
  console.log(`  POST /webhook - Receive messages`);
  console.log(`  GET  /payment/success - Payment success callback`);
  console.log(`  GET  /payment/failure - Payment failure callback`);
  console.log(`  GET  /test/data - View test data`);
  console.log(`  POST /test/clear - Clear test data`);
  console.log('\n🤖 Bot is ready! Send "hi" to test.');
});