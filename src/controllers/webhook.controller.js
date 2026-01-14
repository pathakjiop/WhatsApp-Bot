const WhatsAppService = require('../services/whatsapp.service');
const MessageController = require('./message.controller');
const { validate, schemas } = require('../utils/validator');
const logger = require('../utils/logger');
const whatsappConfig = require('../config/whatsapp.config');

class WebhookController {
  async verify(req, res) {
    try {
      const mode = req.query['hub.mode'];
      const token = req.query['hub.verify_token'];
      const challenge = req.query['hub.challenge'];

      if (mode === 'subscribe' && token === whatsappConfig.verifyToken) {
        logger.info('Webhook verified successfully');
        res.status(200).send(challenge);
      } else {
        logger.error('Webhook verification failed');
        res.status(403).send('Verification failed');
      }
    } catch (error) {
      logger.error('Error in webhook verification:', error);
      res.status(500).send('Internal server error');
    }
  }

  async handleWebhook(req, res) {
    try {
      // Validate webhook payload
      validate(schemas.webhookPayload, req.body);
      
      const entry = req.body.entry?.[0];
      const changes = entry?.changes?.[0]?.value;
      
      if (!changes) {
        return res.status(200).send('EVENT_RECEIVED');
      }

      // Mark message as read
      const message = changes.messages?.[0];
      if (message?.id) {
        await WhatsAppService.markMessageAsRead(message.id);
      }

      // Process message
      if (message) {
        await MessageController.handleIncomingMessage(message, changes);
      }

      res.status(200).send('EVENT_RECEIVED');
    } catch (error) {
      logger.error('Error handling webhook:', error);
      res.status(200).send('EVENT_RECEIVED'); // Still return 200 to WhatsApp
    }
  }
}

module.exports = new WebhookController();