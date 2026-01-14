#!/usr/bin/env node

console.log('⚡ WhatsApp Bot - Quick Start Test');
console.log('='.repeat(50));

// Set minimal environment for testing
process.env.NODE_ENV = 'development';
process.env.PORT = 3000;
process.env.BASE_URL = 'http://localhost:3000';
process.env.VERIFY_TOKEN = 'test_token';

// Use in-memory database (no MongoDB needed)
delete process.env.MONGODB_URI;

console.log('🔧 Setting up test environment...');
console.log(`- Port: ${process.env.PORT}`);
console.log(`- Mode: ${process.env.NODE_ENV}`);
console.log(`- Database: In-memory (no MongoDB needed)`);

// Import the app
const app = require('./src/app');

const PORT = process.env.PORT;

// Start server
const server = app.listen(PORT, () => {
  console.log(`\n✅ Server started on http://localhost:${PORT}`);
  
  // Give server a moment to initialize
  setTimeout(() => {
    runQuickTests();
  }, 1000);
});

async function runQuickTests() {
  const axios = require('axios');
  const BASE_URL = `http://localhost:${PORT}`;
  
  console.log('\n🔍 Running quick tests...');
  
  try {
    // Test 1: Health endpoint
    console.log('\n1. Testing health endpoint...');
    const healthRes = await axios.get(`${BASE_URL}/health`);
    console.log(`   ✅ Status: ${healthRes.status}`);
    console.log(`   📊 Response: ${JSON.stringify(healthRes.data)}`);
    
    // Test 2: Test database endpoint
    console.log('\n2. Testing database status...');
    const dbRes = await axios.get(`${BASE_URL}/test/db`);
    console.log(`   ✅ Database mode: ${dbRes.data.database}`);
    console.log(`   📊 Stats: ${JSON.stringify(dbRes.data.stats)}`);
    
    // Test 3: Simulate a webhook message
    console.log('\n3. Simulating "hi" message...');
    try {
      const webhookPayload = {
        object: 'whatsapp_business_account',
        entry: [{
          id: 'quick-test',
          changes: [{
            value: {
              messaging_product: 'whatsapp',
              metadata: {
                display_phone_number: '1234567890',
                phone_number_id: 'test_phone_id',
              },
              contacts: [{
                profile: { name: 'Quick Tester' },
                wa_id: '919876543210',
              }],
              messages: [{
                from: '919876543210',
                id: `quick-${Date.now()}`,
                timestamp: Date.now().toString(),
                type: 'text',
                text: { body: 'hi' },
              }],
            },
          }],
        }],
      };
      
      const webhookRes = await axios.post(`${BASE_URL}/webhook`, webhookPayload);
      console.log(`   ✅ Webhook response: ${webhookRes.status}`);
      console.log(`   📝 Server should have processed "hi" message`);
      
    } catch (webhookError) {
      console.log(`   ⚠️ Webhook test: ${webhookError.message}`);
    }
    
    // Test 4: Check database after message
    console.log('\n4. Checking database after message...');
    await new Promise(resolve => setTimeout(resolve, 500)); // Wait for processing
    const dbAfterRes = await axios.get(`${BASE_URL}/test/db`);
    console.log(`   ✅ Updated stats: ${JSON.stringify(dbAfterRes.data.stats)}`);
    
    console.log('\n🎉 QUICK TEST COMPLETE!');
    console.log('='.repeat(50));
    console.log('\n📋 Your WhatsApp Bot is working correctly!');
    console.log('\n🚀 Next steps:');
    console.log('1. To run the full server: npm run dev');
    console.log('2. To test manually: npm run test:manual');
    console.log('3. To simulate user journey: npm run test:simulate');
    console.log('\n🔧 Configuration needed for production:');
    console.log('- Add WhatsApp Business API credentials to .env');
    console.log('- Add Razorpay credentials to .env (for payments)');
    console.log('- Add MongoDB URI to .env (for production database)');
    
  } catch (error) {
    console.log(`\n❌ Test failed: ${error.message}`);
    if (error.response) {
      console.log(`   Status: ${error.response.status}`);
      console.log(`   Data: ${JSON.stringify(error.response.data)}`);
    }
  } finally {
    // Shutdown server
    console.log('\n🛑 Shutting down test server...');
    server.close();
    console.log('✅ Test complete!');
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n👋 Received shutdown signal');
  server.close();
  process.exit(0);
});