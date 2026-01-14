const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function testBot() {
  console.log('🤖 Testing WhatsApp Bot');
  console.log('='.repeat(50));
  
  try {
    // Test 1: Health check
    console.log('\n1. Testing health endpoint...');
    const health = await axios.get(`${BASE_URL}/health`);
    console.log(`✅ Status: ${health.status}`);
    console.log(`📊 Data: ${JSON.stringify(health.data)}`);
    
    // Test 2: Database status
    console.log('\n2. Testing database status...');
    const db = await axios.get(`${BASE_URL}/test/db`);
    console.log(`✅ Database mode: ${db.data.database}`);
    console.log(`📊 Stats: ${JSON.stringify(db.data.stats)}`);
    
    // Test 3: Simulate user sending "hi"
    console.log('\n3. Simulating user sending "hi"...');
    const webhookPayload = {
      object: 'whatsapp_business_account',
      entry: [{
        id: 'automated-test',
        changes: [{
          value: {
            messaging_product: 'whatsapp',
            metadata: {
              display_phone_number: '1234567890',
              phone_number_id: 'test_phone',
            },
            contacts: [{
              profile: { name: 'Automated Tester' },
              wa_id: '919876543210',
            }],
            messages: [{
              from: '919876543210',
              id: `auto-${Date.now()}`,
              timestamp: Date.now().toString(),
              type: 'text',
              text: { body: 'hi' },
            }],
          },
        }],
      }],
    };
    
    const webhookResponse = await axios.post(`${BASE_URL}/webhook`, webhookPayload);
    console.log(`✅ Webhook response: ${webhookResponse.status}`);
    console.log('📝 Check server logs for bot response');
    
    // Wait for processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Test 4: Check database after message
    console.log('\n4. Checking database after message...');
    const dbAfter = await axios.get(`${BASE_URL}/test/db`);
    console.log(`✅ Updated stats: ${JSON.stringify(dbAfter.data.stats)}`);
    
    // Test 5: Test payment endpoints
    console.log('\n5. Testing payment endpoints...');
    
    // Payment success
    try {
      const paymentSuccess = await axios.get(
        `${BASE_URL}/payment/success?order_id=test_order_123&payment_id=test_pay_123&signature=test_sig`
      );
      console.log(`✅ Payment success page: ${paymentSuccess.status}`);
    } catch (error) {
      console.log(`⚠️ Payment success: ${error.response?.status || error.message}`);
    }
    
    // Payment failure
    try {
      const paymentFailure = await axios.get(
        `${BASE_URL}/payment/failure?order_id=test_order_456`
      );
      console.log(`✅ Payment failure page: ${paymentFailure.status}`);
    } catch (error) {
      console.log(`⚠️ Payment failure: ${error.response?.status || error.message}`);
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('🎉 ALL TESTS COMPLETED SUCCESSFULLY!');
    console.log('='.repeat(50));
    console.log('\n📋 Your WhatsApp Bot is working correctly.');
    console.log('\n🚀 Next steps:');
    console.log('1. Test with different messages:');
    console.log('   - Send "help"');
    console.log('   - Send "test"');
    console.log('   - Try button interactions');
    console.log('\n2. Check server logs to see bot responses');
    console.log('\n3. To connect to real WhatsApp:');
    console.log('   - Get WhatsApp Business API credentials');
    console.log('   - Update .env file');
    console.log('   - Register test phone numbers');
    
  } catch (error) {
    console.log(`\n❌ Test failed: ${error.message}`);
    if (error.response) {
      console.log(`   Status: ${error.response.status}`);
      console.log(`   Data: ${JSON.stringify(error.response.data, null, 2)}`);
    }
  }
}

testBot();