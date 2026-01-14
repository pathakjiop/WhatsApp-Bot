#!/usr/bin/env node

require('dotenv').config();
const readline = require('readline');
const axios = require('axios');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const TEST_PHONE = process.env.TEST_PHONE || '919876543210';

console.log('🤖 WhatsApp Bot Manual Tester');
console.log('='.repeat(50));
console.log(`Server: ${BASE_URL}`);
console.log(`Test Phone: ${TEST_PHONE}`);
console.log('='.repeat(50));

const menu = () => {
  console.log('\n📋 TEST MENU:');
  console.log('1. Test Health Check');
  console.log('2. Test Webhook Verification');
  console.log('3. Send "hi" message');
  console.log('4. Select 8A Service');
  console.log('5. Select 7/12 Service');
  console.log('6. Select Ferfar Service');
  console.log('7. Select Property Card Service');
  console.log('8. Test Payment Success');
  console.log('9. Test Payment Failure');
  console.log('10. Run Complete Journey');
  console.log('0. Exit');
  
  rl.question('\nSelect option: ', handleChoice);
};

const handleChoice = async (choice) => {
  switch(choice) {
    case '1':
      await testHealthCheck();
      break;
    case '2':
      await testWebhookVerification();
      break;
    case '3':
      await sendMessage('hi');
      break;
    case '4':
      await sendButton('8a_service');
      break;
    case '5':
      await sendButton('712_service');
      break;
    case '6':
      await sendButton('ferfar_service');
      break;
    case '7':
      await sendButton('property_card_service');
      break;
    case '8':
      await testPaymentSuccess();
      break;
    case '9':
      await testPaymentFailure();
      break;
    case '10':
      await runCompleteJourney();
      break;
    case '0':
      console.log('👋 Goodbye!');
      rl.close();
      return;
    default:
      console.log('❌ Invalid choice');
  }
  
  setTimeout(menu, 1000);
};

const testHealthCheck = async () => {
  console.log('\n🔍 Testing Health Check...');
  try {
    const response = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Health Check Response:');
    console.log(`Status: ${response.status}`);
    console.log(`Data: ${JSON.stringify(response.data, null, 2)}`);
  } catch (error) {
    console.log('❌ Health Check Failed:');
    console.log(`Error: ${error.message}`);
  }
};

const testWebhookVerification = async () => {
  console.log('\n🔍 Testing Webhook Verification...');
  const verifyToken = process.env.VERIFY_TOKEN || 'test_token';
  
  try {
    const response = await axios.get(
      `${BASE_URL}/webhook?hub.mode=subscribe&hub.verify_token=${verifyToken}&hub.challenge=test_challenge`
    );
    console.log(`✅ Webhook Verification Response: ${response.status}`);
    console.log(`Challenge: ${response.data}`);
  } catch (error) {
    console.log('❌ Webhook Verification Failed:');
    console.log(`Status: ${error.response?.status}`);
    console.log(`Error: ${error.message}`);
  }
};

const sendMessage = async (text) => {
  console.log(`\n📤 Sending message: "${text}"...`);
  
  const payload = {
    object: 'whatsapp_business_account',
    entry: [{
      id: 'manual-test',
      changes: [{
        value: {
          messaging_product: 'whatsapp',
          metadata: {
            display_phone_number: '1234567890',
            phone_number_id: process.env.WHATSAPP_PHONE_NUMBER_ID || 'test_id',
          },
          contacts: [{
            profile: { name: 'Manual Tester' },
            wa_id: TEST_PHONE,
          }],
          messages: [{
            from: TEST_PHONE,
            id: `manual-${Date.now()}`,
            timestamp: Date.now().toString(),
            type: 'text',
            text: { body: text },
          }],
        },
      }],
    }],
  };
  
  try {
    const response = await axios.post(`${BASE_URL}/webhook`, payload);
    console.log(`✅ Message sent. Response: ${response.status}`);
    console.log('Check your server logs for processing details.');
  } catch (error) {
    console.log('❌ Failed to send message:');
    console.log(`Error: ${error.message}`);
  }
};

const sendButton = async (buttonId) => {
  console.log(`\n📤 Sending button: "${buttonId}"...`);
  
  const payload = {
    object: 'whatsapp_business_account',
    entry: [{
      id: 'manual-test',
      changes: [{
        value: {
          messaging_product: 'whatsapp',
          metadata: {
            display_phone_number: '1234567890',
            phone_number_id: process.env.WHATSAPP_PHONE_NUMBER_ID || 'test_id',
          },
          contacts: [{
            profile: { name: 'Manual Tester' },
            wa_id: TEST_PHONE,
          }],
          messages: [{
            from: TEST_PHONE,
            id: `manual-${Date.now()}`,
            timestamp: Date.now().toString(),
            type: 'interactive',
            interactive: {
              type: 'button_reply',
              button_reply: {
                id: buttonId,
                title: buttonId.replace('_', ' '),
              },
            },
          }],
        },
      }],
    }],
  };
  
  try {
    const response = await axios.post(`${BASE_URL}/webhook`, payload);
    console.log(`✅ Button sent. Response: ${response.status}`);
    console.log('Check your server logs for processing details.');
  } catch (error) {
    console.log('❌ Failed to send button:');
    console.log(`Error: ${error.message}`);
  }
};

const testPaymentSuccess = async () => {
  console.log('\n💰 Testing Payment Success...');
  
  try {
    const response = await axios.get(
      `${BASE_URL}/payment/success?order_id=test_order&payment_id=test_payment&signature=test_signature`
    );
    console.log(`✅ Payment Success Test: ${response.status}`);
    console.log('Check your server logs for payment processing.');
  } catch (error) {
    console.log('❌ Payment Success Test Failed:');
    console.log(`Error: ${error.message}`);
  }
};

const testPaymentFailure = async () => {
  console.log('\n💰 Testing Payment Failure...');
  
  try {
    const response = await axios.get(
      `${BASE_URL}/payment/failure?order_id=test_order`
    );
    console.log(`✅ Payment Failure Test: ${response.status}`);
    console.log('Check your server logs for payment processing.');
  } catch (error) {
    console.log('❌ Payment Failure Test Failed:');
    console.log(`Error: ${error.message}`);
  }
};

const runCompleteJourney = async () => {
  console.log('\n🚀 Running Complete User Journey...');
  
  try {
    // Step 1: Send hi
    console.log('1. Sending "hi"...');
    await sendMessage('hi');
    
    // Wait and select service
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('\n2. Selecting 8A Service...');
    await sendButton('8a_service');
    
    console.log('\n🎉 Journey completed!');
    console.log('Check your server logs to see the complete flow.');
  } catch (error) {
    console.log('❌ Journey failed:');
    console.log(`Error: ${error.message}`);
  }
};

// Start the manual tester
menu();