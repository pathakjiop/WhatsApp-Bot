#!/usr/bin/env node

require('dotenv').config();
const axios = require('axios');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

console.log('🤖 WhatsApp Bot Simulator');
console.log('='.repeat(50));

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const DEFAULT_PHONE = '919876543210';

const simulateMessage = async (phone, message, type = 'text') => {
  try {
    const payload = {
      object: 'whatsapp_business_account',
      entry: [{
        id: 'simulator',
        changes: [{
          value: {
            messaging_product: 'whatsapp',
            metadata: {
              display_phone_number: '1234567890',
              phone_number_id: process.env.WHATSAPP_PHONE_NUMBER_ID || 'simulator_phone_id',
            },
            contacts: [{
              profile: { name: 'Simulator User' },
              wa_id: phone,
            }],
            messages: [{
              from: phone,
              id: `sim_${Date.now()}`,
              timestamp: Date.now().toString(),
              type: type,
              ...(type === 'text' ? { text: { body: message } } : {}),
              ...(type === 'interactive' ? {
                interactive: {
                  type: 'button_reply',
                  button_reply: {
                    id: message,
                    title: message.replace('_', ' '),
                  },
                },
              } : {}),
            }],
          },
        }],
      }],
    };

    console.log(`📤 Sending to ${phone}: "${message}" (${type})`);
    const response = await axios.post(`${BASE_URL}/webhook`, payload);
    
    console.log(`✅ Response: ${response.status}`);
    return true;
  } catch (error) {
    console.log(`❌ Failed: ${error.message}`);
    return false;
  }
};

const simulateFlow = async () => {
  console.log('\n🚀 Simulating Complete User Flow');
  console.log('='.repeat(50));
  
  const phone = DEFAULT_PHONE;
  
  console.log('\n👤 User: Sends "hi" to start');
  await simulateMessage(phone, 'hi');
  await delay(1000);
  
  console.log('\n📱 Bot: Should show service buttons');
  console.log('👤 User: Selects "8A Form"');
  await simulateMessage(phone, '8a_service', 'interactive');
  await delay(1000);
  
  console.log('\n📱 Bot: Should open WhatsApp Flow or respond');
  console.log('👤 User: Fills form (simulated)');
  await delay(1000);
  
  console.log('\n💰 Bot: Should send payment link');
  console.log('👤 User: Makes payment');
  
  // Test payment success
  console.log('\n🔄 Testing payment callback...');
  try {
    const paymentRes = await axios.get(
      `${BASE_URL}/payment/success?order_id=sim_order_123&payment_id=sim_pay_123&signature=sim_sig`
    );
    console.log(`✅ Payment callback: ${paymentRes.status}`);
  } catch (error) {
    console.log(`⚠️ Payment callback: ${error.message}`);
  }
  
  console.log('\n📱 Bot: Should send confirmation message');
  console.log('\n🎉 Flow simulation complete!');
  console.log('\n📋 Check server logs for detailed processing.');
};

const menu = () => {
  console.log('\n📋 SIMULATION MENU:');
  console.log('1. Send "hi" message');
  console.log('2. Select 8A Service');
  console.log('3. Select 7/12 Service');
  console.log('4. Select Ferfar Service');
  console.log('5. Select Property Card Service');
  console.log('6. Run complete flow');
  console.log('7. Test payment success');
  console.log('8. Test payment failure');
  console.log('9. Custom message');
  console.log('0. Exit');
  
  rl.question('\nSelect option: ', handleMenu);
};

const handleMenu = async (choice) => {
  const phone = DEFAULT_PHONE;
  
  switch(choice) {
    case '1':
      await simulateMessage(phone, 'hi');
      break;
    case '2':
      await simulateMessage(phone, '8a_service', 'interactive');
      break;
    case '3':
      await simulateMessage(phone, '712_service', 'interactive');
      break;
    case '4':
      await simulateMessage(phone, 'ferfar_service', 'interactive');
      break;
    case '5':
      await simulateMessage(phone, 'property_card_service', 'interactive');
      break;
    case '6':
      await simulateFlow();
      break;
    case '7':
      await testPaymentSuccess();
      break;
    case '8':
      await testPaymentFailure();
      break;
    case '9':
      rl.question('Enter message: ', async (msg) => {
        await simulateMessage(phone, msg);
        menu();
      });
      return;
    case '0':
      console.log('👋 Goodbye!');
      rl.close();
      return;
    default:
      console.log('❌ Invalid choice');
  }
  
  setTimeout(menu, 1000);
};

async function testPaymentSuccess() {
  console.log('\n💰 Testing payment success...');
  try {
    const response = await axios.get(
      `${BASE_URL}/payment/success?order_id=test_order&payment_id=test_payment&signature=test_signature`
    );
    console.log(`✅ Payment success: ${response.status}`);
  } catch (error) {
    console.log(`❌ Payment test failed: ${error.message}`);
  }
}

async function testPaymentFailure() {
  console.log('\n💰 Testing payment failure...');
  try {
    const response = await axios.get(
      `${BASE_URL}/payment/failure?order_id=test_order`
    );
    console.log(`✅ Payment failure: ${response.status}`);
  } catch (error) {
    console.log(`❌ Payment test failed: ${error.message}`);
  }
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Check if server is running
axios.get(`${BASE_URL}/health`)
  .then(() => {
    console.log(`✅ Connected to server: ${BASE_URL}`);
    menu();
  })
  .catch(error => {
    console.log(`❌ Cannot connect to server at ${BASE_URL}`);
    console.log(`Error: ${error.message}`);
    console.log('\n⚠️ Please start the server first:');
    console.log('   npm run dev');
    rl.close();
  });