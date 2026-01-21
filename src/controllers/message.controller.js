const database = require("../services/database.service")
const whatsappService = require("../services/whatsapp.service")
const { welcomeMessage } = require("../templates/welcome.template")
const logger = require("../utils/logger")

class MessageController {
  async handleMessage(from, messageText, messageId = null, messageType = "text") {
    console.log(`\n💬 PROCESSING MESSAGE:`)
    console.log(`From: ${from}`)
    console.log(`Text: ${messageText}`)
    console.log(`Type: ${messageType}`)

    try {
      // Ensure user exists
      const user = await database.upsertUser(from, {
        whatsappId: from,
        phoneNumber: from,
        lastSeen: new Date().toISOString(),
        lastMessage: messageText,
      })

      console.log(`User: ${user.name || "New user"} (${from})`)

      const text = messageText.toLowerCase().trim()

      // Handle 'hi' or 'hello' - send welcome with service buttons
      if (text === "hi" || text === "hello" || text === "start") {
        console.log("Sending welcome message with service buttons...")
        // an await where we will be deleting the message
        if (messageId) {
          await whatsappService.deleteMessage(messageId)
        }
        await whatsappService.sendMessage(from, welcomeMessage())
        return
      }

      if (text === "8a_service" || text === "8a" || text === "8a form") {
        console.log("User selected 8A Form - triggering WhatsApp Flow")
        await this.triggerServiceFlow(from, "8a_service", "8A Form")
        return
      }

      if (text === "712_service" || text === "712" || text === "7/12") {
        console.log("User selected 7/12 Form - triggering WhatsApp Flow")
        await this.triggerServiceFlow(from, "712_service", "7/12 Form")
        return
      }

      if (text === "ferfar_service" || text === "ferfar") {
        console.log("User selected Ferfar - triggering WhatsApp Flow")
        await this.triggerServiceFlow(from, "ferfar_service", "Ferfar")
        return
      }

      if (text === "property_card_service" || text === "property" || text === "property card") {
        console.log("User selected Property Card - triggering WhatsApp Flow")
        await this.triggerServiceFlow(from, "property_card_service", "Property Card")
        return
      }

      // If no match, send default response
      await whatsappService.sendTextMessage(from, 'I didn\'t understand that. Type "hi" to see available services.')
    } catch (error) {
      console.error("Error processing message:", error)
      await whatsappService.sendTextMessage(
        from,
        'Sorry, I encountered an error. Please try again or send "hi" to restart.',
      )
    }
  }

  async triggerServiceFlow(whatsappId, serviceId, serviceName) {
    try {
      // Create or update session with pending flow
      await database.createOrUpdateSession(whatsappId, {
        whatsappId,
        step: "awaiting_flow_completion",
        selectedService: serviceId,
        serviceName: serviceName,
        createdAt: new Date().toISOString(),
      })

      // Send message with WhatsApp Flow
      const flowMessage = this.buildFlowMessage(serviceId, serviceName)
      await whatsappService.sendMessage(whatsappId, flowMessage)
    } catch (error) {
      logger.error("Error triggering service flow:", error)
      throw error
    }
  }

  buildFlowMessage(serviceId, serviceName) {
    const flowIds = {
      "8a_service": process.env.WHATSAPP_FLOW_ID_8A || "1234567890",
      "712_service": process.env.WHATSAPP_FLOW_ID_712 || "1234567891",
      ferfar_service: process.env.WHATSAPP_FLOW_ID_FERFAR || "1234567892",
      property_card_service: process.env.WHATSAPP_FLOW_ID_PROPERTY || "1234567893",
    }

    return {
      type: "interactive",
      interactive: {
        type: "flow",
        header: {
          type: "text",
          text: serviceName,
        },
        body: {
          text: `Please fill out the ${serviceName} form to proceed with your application.`,
        },
        footer: {
          text: "Your data is secure and encrypted.",
        },
        action: {
          name: "flow",
          parameters: {
            flow_message_version: "3",
            flow_action: "navigate",
            flow_id: flowIds[serviceId],
            flow_cta: "Start Form",
            flow_token: `token_${Date.now()}_${serviceId}`,
          },
        },
      },
    }
  }

  async handleFlowCompletion(whatsappId, flowToken, flowData) {
    try {
      console.log("Flow completed by user:", whatsappId)
      console.log("Flow data:", flowData)

      // Get user session to know which service they selected
      const session = await database.findSessionByWhatsappId(whatsappId)

      if (!session) {
        await whatsappService.sendTextMessage(whatsappId, 'Session expired. Please start over by sending "hi".')
        return
      }

      // Create order with form data
      const order = await database.createOrder({
        orderId: `ORD_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        whatsappId,
        serviceType: session.serviceName,
        userData: flowData,
        amount: this.getServiceAmount(session.serviceName),
        status: "pending",
        paymentStatus: "pending",
        createdAt: new Date().toISOString(),
      })

      console.log("Order created:", order.orderId)

      // Update session
      await database.createOrUpdateSession(whatsappId, {
        ...session,
        step: "awaiting_payment",
        orderId: order.orderId,
      })

      // Generate payment link
      const paymentLink = `${process.env.BASE_URL || "http://localhost:3000"}/payment/checkout?orderId=${order.orderId}&whatsappId=${whatsappId}`

      // Send payment message
      const paymentMessage = `Thank you for filling the form!\n\nOrder ID: ${order.orderId}\nService: ${session.serviceName}\nAmount: ₹${order.amount}\n\nClick below to proceed with payment:`

      await whatsappService.sendTextMessage(whatsappId, paymentMessage)
      await whatsappService.sendPaymentLink(whatsappId, {
        orderId: order.orderId,
        service: session.serviceName,
        amount: order.amount,
        paymentLink: paymentLink,
      })
    } catch (error) {
      logger.error("Error handling flow completion:", error)
      await whatsappService.sendTextMessage(
        whatsappId,
        "An error occurred while processing your form. Please try again.",
      )
    }
  }

  getServiceAmount(serviceName) {
    const amounts = {
      "8A Form": 500,
      "7/12 Form": 300,
      Ferfar: 400,
      "Property Card": 250,
    }
    return amounts[serviceName] || 100
  }
}

module.exports = new MessageController()
