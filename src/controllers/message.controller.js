const WhatsAppService = require('../services/whatsapp.service');
const FlowController = require('./flow.controller');
const { welcomeMessage, serviceFlowResponse } = require('../templates/welcome.template');
const User = require('../models/user.model');
const logger = require('../utils/logger');

class MessageController {
  async handleIncomingMessage(message, webhookData) {
    const from = message.from;
    const messageType = message.type;
    
    try {
      // Create or update user
      await this.ensureUserExists(from, webhookData);
      
      // Handle different message types
      switch (messageType) {
        case 'text':
          await this.handleTextMessage(from, message.text.body);
          break;
          
        case 'interactive':
          await this.handleInteractiveMessage(from, message.interactive);
          break;
          
        case 'button':
          await this.handleButtonMessage(from, message.button);
          break;
          
        default:
          logger.warn(`Unhandled message type: ${messageType}`, { from });
          await this.sendFallbackMessage(from);
      }
    } catch (error) {
      logger.error('Error handling incoming message:', error);
      await this.sendErrorMessage(from);
    }
  }

  async handleTextMessage(from, text) {
    const normalizedText = text.trim().toLowerCase();
    
    if (normalizedText === 'hi' || normalizedText === 'hello' || normalizedText === 'start') {
      await this.sendWelcomeMessage(from);
    } else if (normalizedText === 'help') {
      await this.sendHelpMessage(from);
    } else if (normalizedText === 'test') {
      await this.sendTestResponse(from);
    } else {
      await this.sendDefaultResponse(from);
    }
  }

  async handleInteractiveMessage(from, interactive) {
    const type = interactive.type;
    
    if (type === 'button_reply') {
      const buttonId = interactive.button_reply.id;
      await this.handleButtonResponse(from, buttonId);
    } else if (type === 'flow_reply') {
      const flowToken = interactive.flow_reply.flow_token;
      await FlowController.handleFlowCompletion(from, flowToken);
    }
  }

  async handleButtonMessage(from, button) {
    const payload = button.payload;
    await this.handleButtonResponse(from, payload);
  }

  async handleButtonResponse(from, buttonId) {
    switch (buttonId) {
      case '8a_service':
      case '712_service':
      case 'ferfar_service':
      case 'property_card_service':
        const flowMessage = serviceFlowResponse(buttonId);
        await WhatsAppService.sendInteractiveMessage(from, flowMessage.interactive);
        break;
        
      case 'help':
        await this.sendHelpMessage(from);
        break;
        
      default:
        await WhatsAppService.sendTextMessage(
          from,
          'Please select a valid option from the menu or type "help" for assistance.'
        );
    }
  }

  async sendWelcomeMessage(from) {
    try {
      if (WhatsAppService.isTestMode()) {
        console.log(`🧪 TEST MODE: Sending welcome message to ${from}`);
        // In test mode, send a text version
        await WhatsAppService.sendTextMessage(
          from,
          'Welcome to Land Record Services! 🏡\n\nPlease choose a service:\n\n1. 8A Form\n2. 7/12 Form\n3. Ferfar\n4. Property Card\n\nReply with the number or type "help" for assistance.'
        );
      } else {
        await WhatsAppService.sendInteractiveMessage(from, welcomeMessage().interactive);
      }
      logger.info('Welcome message sent', { from });
    } catch (error) {
      logger.error('Error sending welcome message:', error);
      // Fallback to text message
      await WhatsAppService.sendTextMessage(
        from,
        'Welcome! Please choose a service:\n1. 8A Form\n2. 7/12 Form\n3. Ferfar\n4. Property Card\n\nType the number or name of the service you want.'
      );
    }
  }

  async sendHelpMessage(from) {
    const helpText = `🆘 *Help Guide* 🆘

*Available Services:*
1. *8A Form* - Application for land records
2. *7/12 Form* - Extract of land records
3. *Ferfar* - Mutation application
4. *Property Card* - Property details extract

*How to use:*
- Send "hi" to start
- Select a service from the menu
- Fill the form when prompted
- Complete payment
- Receive confirmation

*Commands:*
- "hi" - Start conversation
- "help" - Show this help
- "test" - Test the bot
- "status" - Check your applications

Need more help? Contact support.`;
    
    await WhatsAppService.sendTextMessage(from, helpText);
  }

  async sendTestResponse(from) {
    const testText = `🧪 *Bot Test Mode* 🧪

*Bot Status:* ✅ Active
*Test Mode:* ${WhatsAppService.isTestMode() ? '✅ Enabled' : '❌ Disabled'}
*Database:* Working
*Payment Gateway:* ${process.env.RAZORPAY_KEY_ID ? '✅ Configured' : '❌ Test Mode'}

*Test Commands:*
1. Try sending "hi"
2. Select a service
3. Test payment flow

This is a test response to verify the bot is working correctly.`;
    
    await WhatsAppService.sendTextMessage(from, testText);
  }

  async sendDefaultResponse(from) {
    await WhatsAppService.sendTextMessage(
      from,
      'I\'m here to help with land record services. Please send "hi" to start or "help" for assistance.'
    );
  }

  async sendFallbackMessage(from) {
    await WhatsAppService.sendTextMessage(
      from,
      'I can only process text messages and button clicks. Please send "hi" to start.'
    );
  }

  async sendErrorMessage(from) {
    await WhatsAppService.sendTextMessage(
      from,
      'Sorry, an error occurred. Please try again in a moment or type "help" for assistance.'
    );
  }

  async ensureUserExists(whatsappId, webhookData) {
    try {
      const contact = webhookData.contacts?.[0];
      const user = await User.findOneAndUpdate(
        { whatsappId },
        {
          phoneNumber: whatsappId,
          name: contact?.profile?.name || 'Unknown',
          lastInteraction: new Date(),
        },
        { upsert: true, new: true }
      );
      
      if (WhatsAppService.isTestMode()) {
        console.log(`🧪 TEST MODE: User ${whatsappId} ensured in database`);
      }
      
      return user;
    } catch (error) {
      logger.error('Error ensuring user exists:', error);
    }
  }
}

module.exports = new MessageController();