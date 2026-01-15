async handleMessage(from, messageText, messageType = 'text') {
  console.log(`\n💬 PROCESSING MESSAGE:`);
  console.log(`From: ${from}`);
  console.log(`Text: ${messageText}`);
  console.log(`Type: ${messageType}`);
  
  try {
    // Ensure user exists in database
    const user = await database.upsertUser(from, {
      phoneNumber: from,
      lastSeen: new Date().toISOString(),
      lastMessage: messageText
    });
    
    console.log(`👤 User: ${user.name || 'New user'} (${from})`);
    
    // Get or create session
    let session = await database.findSessionByWhatsappId(from);
    if (!session) {
      session = await database.createSession({
        whatsappId: from,
        step: 'start',
        createdAt: new Date().toISOString()
      });
      console.log(`🆕 New session created for ${from}`);
    }
    
    console.log(`📋 Current step: ${session.step}`);
    
    // Process based on current step
    const text = messageText.toLowerCase().trim();
    
    if (session.step === 'start') {
      await this.handleStart(from, text, session);
    } else if (session.step === 'awaiting_confirmation') {
      await this.handleConfirmation(from, text, session);
    } else if (session.step === 'awaiting_user_info') {
      await this.handleUserInfo(from, messageText, session);
    } else if (session.step === 'confirming_info') {
      await this.handleInfoConfirmation(from, text, session);
    } else {
      await this.handleDefault(from, text, session);
    }
    
  } catch (error) {
    console.error('❌ Error processing message:', error);
    
    // Send error message to user
    await whatsappService.sendTextMessage(
      from,
      "Sorry, I encountered an error. Please try again or send 'hi' to restart."
    );
  }
}