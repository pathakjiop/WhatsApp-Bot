class WebhookController {
  async verify(req, res) {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    console.log('🔍 Webhook verification attempt:');
    console.log(`Mode: ${mode}`);
    console.log(`Token: ${token}`);
    console.log(`Expected: ${process.env.VERIFY_TOKEN}`);

    if (mode === 'subscribe' && token === process.env.VERIFY_TOKEN) {
      console.log('✅ Webhook verified successfully');
      res.status(200).send(challenge);
    } else {
      console.log('❌ Webhook verification failed');
      res.status(403).send('Verification failed');
    }
  }

  async handleWebhook(req, res) {
    try {
      console.log('📨 RAW WEBHOOK RECEIVED:', JSON.stringify(req.body, null, 2));
      
      const entry = req.body.entry?.[0];
      if (!entry) {
        console.log('⚠️ No entry in webhook');
        return res.status(200).send('EVENT_RECEIVED');
      }

      const changes = entry.changes?.[0];
      if (!changes) {
        console.log('⚠️ No changes in entry');
        return res.status(200).send('EVENT_RECEIVED');
      }

      const value = changes.value;
      
      // Handle different types of webhooks
      if (value.messages) {
        // Incoming messages from users
        await this.handleIncomingMessages(value);
      } else if (value.statuses) {
        // Message status updates (sent, delivered, read)
        await this.handleStatusUpdates(value);
      } else if (value.contacts) {
        // Contact updates
        await this.handleContactUpdates(value);
      } else if (value.errors) {
        // Error notifications
        await this.handleErrors(value);
      } else if (value.messaging_product === 'whatsapp' && value.to) {
        // Template/outbound message notifications
        console.log('📤 Outbound message notification:', value.type);
      } else {
        console.log('🤔 Unknown webhook type:', Object.keys(value));
      }

      res.status(200).send('EVENT_RECEIVED');
      
    } catch (error) {
      console.error('❌ Webhook processing error:', error);
      res.status(200).send('EVENT_RECEIVED');
    }
  }

  async handleIncomingMessages(value) {
    const messages = value.messages;
    console.log(`📩 Received ${messages.length} message(s)`);
    
    for (const message of messages) {
      console.log(`\n📱 Message Details:`);
      console.log(`From: ${message.from}`);
      console.log(`Type: ${message.type}`);
      console.log(`ID: ${message.id}`);
      console.log(`Timestamp: ${message.timestamp}`);
      
      // Import here to avoid circular dependency
      const messageController = require('./message.controller');
      
      if (message.type === 'text') {
        console.log(`Text: ${message.text.body}`);
        await messageController.handleMessage(message.from, message.text.body);
        
      } else if (message.type === 'interactive') {
        console.log(`Interactive: ${message.interactive.type}`);
        if (message.interactive.type === 'button_reply') {
          await messageController.handleButtonClick(
            message.from, 
            message.interactive.button_reply.id
          );
        } else if (message.interactive.type === 'list_reply') {
          await messageController.handleMessage(
            message.from,
            message.interactive.list_reply.id
          );
        }
        
      } else if (message.type === 'button') {
        console.log(`Button: ${message.button.text}`);
        await messageController.handleMessage(
          message.from,
          message.button.text
        );
        
      } else {
        console.log(`Unhandled message type: ${message.type}`);
        // Still send a response for unhandled types
        const whatsappService = require('../services/whatsapp.service');
        await whatsappService.sendTextMessage(
          message.from,
          "I can only process text messages right now. Please send 'hi' to start."
        );
      }
    }
  }

  async handleStatusUpdates(value) {
    const statuses = value.statuses;
    console.log(`📊 Status updates: ${statuses.length}`);
    
    for (const status of statuses) {
      console.log(`Message ${status.id}: ${status.status}`);
      // You could update message status in your database here
    }
  }

  async handleContactUpdates(value) {
    const contacts = value.contacts;
    console.log(`👤 Contact updates: ${contacts.length}`);
    
    for (const contact of contacts) {
      console.log(`Contact: ${contact.wa_id} - ${contact.profile.name}`);
      // Update user profile in database
    }
  }

  async handleErrors(value) {
    const errors = value.errors;
    console.log(`❌ Errors: ${errors.length}`);
    
    for (const error of errors) {
      console.log(`Error ${error.code}: ${error.title}`);
      console.log(`Details: ${error.message}`);
    }
  }
}

module.exports = new WebhookController();