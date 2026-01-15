const axios = require('axios');

class WhatsAppService {
  constructor() {
    this.accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
    this.phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    this.apiVersion = process.env.WHATSAPP_API_VERSION || 'v19.0';
    this.baseURL = `https://graph.facebook.com/${this.apiVersion}`;
    
    // Check if we have real credentials
    this.hasRealCredentials = this.accessToken && 
                             !this.accessToken.includes('test') && 
                             this.accessToken !== 'your_whatsapp_access_token_here';
    
    console.log('🔧 WhatsApp Service Config:');
    console.log(`   Has Token: ${!!this.accessToken}`);
    console.log(`   Phone Number ID: ${this.phoneNumberId}`);
    console.log(`   Mode: ${this.hasRealCredentials ? '🚀 PRODUCTION' : '🧪 TEST'}`);
  }

  async sendMessage(to, message) {
    try {
      console.log('\n📤 SENDING WHATSAPP MESSAGE:');
      console.log(`To: ${to}`);
      console.log(`Message Type: ${message.type}`);
      
      if (!this.hasRealCredentials) {
        console.log('❌ CANNOT SEND - Missing real WhatsApp credentials');
        console.log('   Add REAL WHATSAPP_ACCESS_TOKEN and WHATSAPP_PHONE_NUMBER_ID to .env');
        console.log('   Get them from: https://developers.facebook.com/apps/');
        return {
          error: 'Missing WhatsApp credentials',
          test_mode: true,
          would_send: message
        };
      }

      if (!this.accessToken || !this.phoneNumberId) {
        throw new Error('WhatsApp credentials not configured');
      }

      const url = `${this.baseURL}/${this.phoneNumberId}/messages`;
      
      console.log(`URL: ${url}`);
      console.log('Request payload:', JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to,
        ...message
      }, null, 2));
      
      const response = await axios.post(
        url,
        {
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to,
          ...message
        },
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      );

      console.log('✅ WhatsApp API Response:', JSON.stringify(response.data, null, 2));
      return response.data;
      
    } catch (error) {
      console.error('❌ WhatsApp API Error:');
      console.error('Status:', error.response?.status);
      console.error('Error Data:', JSON.stringify(error.response?.data, null, 2));
      console.error('Message:', error.message);
      
      // Return mock for development
      return {
        error: error.response?.data || error.message,
        test_fallback: true,
        mock_id: `mock_${Date.now()}`
      };
    }
  }

  async sendTextMessage(to, text) {
    const message = {
      type: 'text',
      text: { body: text }
    };
    return this.sendMessage(to, message);
  }

  async sendInteractiveMessage(to, buttons) {
    const message = {
      type: 'interactive',
      interactive: {
        type: 'button',
        body: {
          text: 'Please select a service:'
        },
        action: {
          buttons: buttons.map((btn, index) => ({
            type: 'reply',
            reply: {
              id: btn.id,
              title: btn.title
            }
          }))
        }
      }
    };
    
    return this.sendMessage(to, message);
  }

  async sendServiceButtons(to) {
    const buttons = [
      { id: 'service_8a', title: '8A Form' },
      { id: 'service_712', title: '7/12 Form' },
      { id: 'service_ferfar', title: 'Ferfar' },
      { id: 'service_property', title: 'Property Card' }
    ];
    
    return this.sendInteractiveMessage(to, buttons);
  }

  async sendPaymentLink(to, orderDetails) {
    const message = `💰 *Payment Required*\n\n` +
      `Service: ${orderDetails.service}\n` +
      `Amount: ₹${orderDetails.amount}\n` +
      `Order ID: ${orderDetails.orderId}\n\n` +
      `Please pay using this link:\n` +
      `${orderDetails.paymentLink}\n\n` +
      `After payment, you'll receive confirmation here.`;
    
    return this.sendTextMessage(to, message);
  }

  async sendConfirmation(to, orderDetails) {
    const message = `✅ *Payment Successful!*\n\n` +
      `Order ID: ${orderDetails.orderId}\n` +
      `Service: ${orderDetails.service}\n` +
      `Amount: ₹${orderDetails.amount}\n` +
      `Date: ${new Date().toLocaleDateString('en-IN')}\n\n` +
      `Your application has been received. We'll process it within 24 hours.`;
    
    return this.sendTextMessage(to, message);
  }

  isTestMode() {
    return this.testMode;
  }
}

module.exports = new WhatsAppService();
