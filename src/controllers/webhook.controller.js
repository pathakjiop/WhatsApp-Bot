const { handleMessage } = require("./message.controller")
const whatsappService = require("../services/whatsapp.service")
const messageController = require("./message.controller")
const database = require("../services/database.service")

class WebhookController {
  constructor() {
    this.handleWebhook = this.handleWebhook.bind(this)
    this.verify = this.verify.bind(this)
  }

  // ======================
  // WEBHOOK VERIFICATION
  // ======================
  async verify(req, res) {
    const mode = req.query["hub.mode"]
    const token = req.query["hub.verify_token"]
    const challenge = req.query["hub.challenge"]

    console.log("Webhook verification attempt:")
    console.log(`Mode: ${mode}`)
    console.log(`Token: ${token}`)
    console.log(`Expected: ${process.env.VERIFY_TOKEN}`)

    if (mode === "subscribe" && token === process.env.VERIFY_TOKEN) {
      console.log("Webhook verified successfully")
      return res.status(200).send(challenge)
    }

    console.log("Webhook verification failed")
    return res.sendStatus(403)
  }

  // ======================
  // MAIN WEBHOOK HANDLER
  // ======================
  async handleWebhook(req, res) {
    try {
      console.log("RAW WEBHOOK RECEIVED:", JSON.stringify(req.body, null, 2))

      const entryList = req.body?.entry
      if (!Array.isArray(entryList)) {
        console.log("No entry array")
        return res.status(200).send("EVENT_RECEIVED")
      }

      for (const entry of entryList) {
        const changes = entry?.changes
        if (!Array.isArray(changes)) continue

        for (const change of changes) {
          const value = change?.value
          if (!value) continue

          if (Array.isArray(value.messages)) {
            await this.handleIncomingMessages(value)
          } else if (Array.isArray(value.statuses)) {
            await this.handleStatusUpdates(value)
          } else if (value.errors) {
            await this.handleErrors(value)
          } else {
            console.log("Unknown webhook payload:", Object.keys(value))
          }
        }
      }

      res.status(200).send("EVENT_RECEIVED")
    } catch (error) {
      console.error("Webhook processing error:", error)
      res.status(200).send("EVENT_RECEIVED") // NEVER 500 - WhatsApp retries
    }
  }

  // ======================
  // INCOMING MESSAGES
  // ======================
  async handleIncomingMessages(value) {
    const messages = value.messages || []
    console.log(`Received ${messages.length} message(s)`)

    for (const message of messages) {
      console.log("\nMessage Details:")
      console.log(`From: ${message.from}`)
      console.log(`Type: ${message.type}`)
      console.log(`ID: ${message.id}`)
      console.log(`Timestamp: ${message.timestamp}`)

      try {
        if (message.type === "text") {
          console.log(`Text: ${message.text.body}`)
          await messageController.handleMessage(message.from, message.text.body, message.id)
        } else if (message.type === "interactive") {
          const interactive = message.interactive || {}
          const replyId = interactive.button_reply?.id || interactive.list_reply?.id
          const flowToken = interactive.nfm_reply?.response_json

          if (flowToken) {
            // Handle WhatsApp Flow completion
            console.log("Flow completed with token:", flowToken)
            const flowData = this.parseFlowResponse(flowToken)
            await messageController.handleFlowCompletion(message.from, flowToken, flowData)
          } else if (replyId) {
            // Handle button reply
            console.log(`Interactive reply: ${replyId}`)
            await messageController.handleMessage(message.from, replyId)
          }
        } else if (message.type === "button") {
          console.log(`Button: ${message.button.text}`)
          await messageController.handleMessage(message.from, message.button.text)
        } else {
          console.log(`Unhandled message type: ${message.type}`)
          await whatsappService.sendTextMessage(
            message.from,
            'I can only process text messages and forms right now. Please send "hi".',
          )
        }
      } catch (err) {
        console.error("Message handling error:", err.message)
      }
    }
  }

  parseFlowResponse(responseJson) {
    try {
      // responseJson is a JSON string with form data
      if (typeof responseJson === "string") {
        return JSON.parse(responseJson)
      }
      return responseJson
    } catch (error) {
      console.error("Error parsing flow response:", error)
      return {}
    }
  }

  // ======================
  // STATUS UPDATES
  // ======================
  async handleStatusUpdates(value) {
    const statuses = value.statuses || []
    console.log(`Status updates: ${statuses.length}`)

    for (const status of statuses) {
      console.log(`Message ${status.id}: ${status.status}`)
    }
  }

  // ======================
  // ERROR HANDLING
  // ======================
  async handleErrors(value) {
    const errors = Array.isArray(value.errors) ? value.errors : [value.errors]

    console.log(`Errors received: ${errors.length}`)

    for (const error of errors) {
      console.log(`Error ${error.code}: ${error.title}`)
      console.log(`Details: ${error.message}`)
    }
  }
}

module.exports = new WebhookController()
