const axios = require('axios');
const whatsappConfig = require('../config/whatsapp.config');
const logger = require('../utils/logger');

class WhatsAppService {
  constructor() {
    this.baseURL = whatsappConfig.baseUrl;
    this.phoneNumberId = whatsappConfig.phoneNumberId;
    this.accessToken = whatsappConfig.accessToken;
    this.testMode = !this.accessToken || this.accessToken.includes('test') || this.accessToken === 'your_whatsapp_access_token_here';
  }

  async sendMessage(to, message) {
    try {
      // If in test mode, log and return mock response
      if (this.testMode) {
        console.log(`🧪 TEST MODE: Would send message to ${to}:`, JSON.stringify(message, null, 2));
        logger.info('Test mode - Message not sent', { to, messageType: message.type });
        
        return {
          messaging_product: 'whatsapp',
          contacts: [{ input: to, wa_id: to }],
          messages: [{ id: `test-${Date.now()}` }]
        };
      }

      const url = `${this.baseURL}/${this.phoneNumberId}/messages`;
      
      const response = await axios.post(
        url,
        {
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to,
          ...message,
        },
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
          timeout: 5000,
        }
      );

      logger.info('Message sent successfully', { to, messageId: response.data.messages[0]?.id });
      return response.data;
    } catch (error) {
      logger.error('Error sending WhatsApp message:', {
        error: error.response?.data || error.message,
        to,
        messageType: message.type,
      });
      
      // In development, return mock response
      if (process.env.NODE_ENV === 'development') {
        console.log('⚠️ Development mode: Returning mock response');
        return {
          messaging_product: 'whatsapp',
          contacts: [{ input: to, wa_id: to }],
          messages: [{ id: `dev-${Date.now()}` }]
        };
      }
      
      throw error;
    }
  }

  async sendTextMessage(to, text) {
    const message = {
      type: 'text',
      text: { body: text },
    };
    return this.sendMessage(to, message);
  }

  async sendInteractiveMessage(to, interactiveMessage) {
    const message = {
      type: 'interactive',
      interactive: interactiveMessage,
    };
    return this.sendMessage(to, message);
  }

  async sendTemplateMessage(to, templateName, languageCode = 'en', components = []) {
    const message = {
      type: 'template',
      template: {
        name: templateName,
        language: {
          code: languageCode,
        },
        components,
      },
    };
    return this.sendMessage(to, message);
  }

  async markMessageAsRead(messageId) {
    try {
      // If in test mode, skip
      if (this.testMode) {
        console.log(`🧪 TEST MODE: Would mark message ${messageId} as read`);
        return;
      }

      const url = `${this.baseURL}/${this.phoneNumberId}/messages`;
      
      await axios.post(
        url,
        {
          messaging_product: 'whatsapp',
          status: 'read',
          message_id: messageId,
        },
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
          timeout: 3000,
        }
      );
      
      logger.info('Message marked as read', { messageId });
    } catch (error) {
      logger.warn('Error marking message as read (non-critical):', error.message);
      // Don't throw error for this non-critical operation
    }
  }
  
  isTestMode() {
    return this.testMode;
  }
}

module.exports = new WhatsAppService();