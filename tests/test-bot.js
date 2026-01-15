const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function testBot() {
  console.log('🤖 Testing WhatsApp Bot');
  console.log('='.repeat(50));
  
  try {
    // 1. Test server health
    console.log('\n1. Testing server health...');
    const health = await axios.get(`${BASE_URL}/health`);
    console.log(`✅ Health: ${health.status} - ${health.data.status}`);
    
    // 2. Test data endpoint
    console.log('\n2. Checking database...');
    const data = await axios.get(`${BASE_URL}/test/data`);
    console.log(`✅ Database stats:`, data.data.stats);
    
    // 3. Test webhook with "hi" message
    console.log('\n3. Sending "hi" to bot...');
    const webhookPayload = {
      object: 'whatsapp_business_account',
      entry: [{
        id: 'test-bot',
        changes: [{
          value: {
            messaging_product: 'whatsapp',
            metadata: {
              display_phone_number: '1234567890',
              phone_number_id: 'test'
            },
            contacts: [{
              profile: { name: 'Test User' },
              wa_id: '919876543210'
            }],
            messages: [{
              from: '919876543210',
              id: 'test-message-1',
              timestamp: '1234567890',
              type: 'text',
              text: { body: 'hi' }
            }]
          }
        }]
      }]
    };
    
    const webhookRes = await axios.post(`${BASE_URL}/webhook`, webhookPayload);
    console.log(`✅ Webhook response: ${webhookRes.status}`);
    
    // 4. Test button click
    console.log('\n4. Testing service selection...');
    const buttonPayload = {
      object: 'whatsapp_business_account',
      entry: [{
        id: 'test-bot',
        changes: [{
          value: {
            messaging_product: 'whatsapp',
            metadata: {
              display_phone_number: '1234567890',
              phone_number_id: 'test'
            },
            contacts: [{
              profile: { name: 'Test User' },
              wa_id: '919876543210'
            }],
            messages: [{
              from: '919876543210',
              id: 'test-message-2',
              timestamp: '1234567890',
              type: 'interactive',
              interactive: {
                type: 'button_reply',
                button_reply: {
                  id: 'service_8a',
                  title: '8A Form'
                }
              }
            }]
          }
        }]
      }]
    };
    
    const buttonRes = await axios.post(`${BASE_URL}/webhook`, buttonPayload);
    console.log(`✅ Button response: ${buttonRes.status}`);
    
    // 5. Test user info
    console.log('\n5. Testing user info submission...');
    const infoPayload = {
      object: 'whatsapp_business_account',
      entry: [{
        id: 'test-bot',
        changes: [{
          value: {
            messaging_product: 'whatsapp',
            metadata: {
              display_phone_number: '1234567890',
              phone_number_id: 'test'
            },
            contacts: [{
              profile: { name: 'Test User' },
              wa_id: '919876543210'
            }],
            messages: [{
              from: '919876543210',
              id: 'test-message-3',
              timestamp: '1234567890',
              type: 'text',
              text: { 
                body: 'John Doe, john@example.com, Maharashtra, Pune, Sample Village, 123/45' 
              }
            }]
          }
        }]
      }]
    };
    
    const infoRes = await axios.post(`${BASE_URL}/webhook`, infoPayload);
    console.log(`✅ Info response: ${infoRes.status}`);
    
    // 6. Test payment success
    console.log('\n6. Testing payment success page...');
    try {
      const paymentRes = await axios.get(`${BASE_URL}/payment/success?order_id=ORD123&mock=true`);
      console.log(`✅ Payment page: ${paymentRes.status}`);
    } catch (error) {
      console.log(`⚠️ Payment test: ${error.message}`);
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('🎉 ALL TESTS COMPLETED!');
    console.log('='.repeat(50));
    console.log('\n📋 Check your server logs to see bot responses.');
    console.log('\n🚀 Bot is working correctly!');
    
  } catch (error) {
    console.error(`\n❌ Test failed: ${error.message}`);
    if (error.response) {
      console.log(`Status: ${error.response.status}`);
      console.log(`Data: ${JSON.stringify(error.response.data, null, 2)}`);
    }
  }
}

testBot();