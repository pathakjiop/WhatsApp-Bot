const database = require("../services/database.service")
const whatsappService = require("../services/whatsapp.service")
const logger = require("../utils/logger")

class PaymentController {
  // Handle payment success callback from Razorpay
  async handleSuccess(req, res) {
    try {
      const { orderId, paymentId, signature } = req.query
      const { mock } = req.body

      console.log("Payment success callback:", { orderId, paymentId, signature, mock })

      if (!orderId) {
        return res.status(400).json({ error: "Missing orderId" })
      }

      const order = await database.findOrderByOrderId(orderId)

      if (!order) {
        console.error("Order not found:", orderId)
        return res.status(404).json({ error: "Order not found" })
      }

      if (mock === "true") {
        console.log("Processing mock payment...")
        await database.updateOrder(orderId, {
          status: "completed",
          paymentStatus: "captured",
          paymentId: paymentId || `mock_${Date.now()}`,
          completedAt: new Date().toISOString(),
        })

        // Send confirmation to WhatsApp
        await this.sendPaymentConfirmation(order.whatsappId, order)

        return res.send(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>Payment Successful</title>
            <style>
              body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background: #f5f5f5; }
              .container { background: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); max-width: 500px; margin: 0 auto; }
              .success { color: #27ae60; font-size: 32px; margin-bottom: 20px; }
              .check { font-size: 48px; }
              .message { margin: 15px 0; font-size: 16px; }
              .order-id { font-weight: bold; color: #2c3e50; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="check">✅</div>
              <div class="success">Payment Successful!</div>
              <div class="message">Order ID: <span class="order-id">${orderId}</span></div>
              <div class="message">Amount: ₹${order.amount}</div>
              <div class="message">Service: ${order.serviceType}</div>
              <div class="message" style="margin-top: 30px; color: #7f8c8d;">You will receive confirmation on WhatsApp shortly.</div>
              <div class="message">You can close this window.</div>
            </div>
          </body>
          </html>
        `)
      }

      if (paymentId && signature) {
        const verified = await this.verifyPaymentSignature(orderId, paymentId, signature)
        if (!verified) {
          return res.status(400).json({ error: "Payment verification failed" })
        }
      }

      // Update order as completed
      await database.updateOrder(orderId, {
        status: "completed",
        paymentStatus: "captured",
        paymentId: paymentId || "razorpay_payment_id",
        completedAt: new Date().toISOString(),
      })

      // Send confirmation to WhatsApp
      await this.sendPaymentConfirmation(order.whatsappId, order)

      // Update session status
      await database.createOrUpdateSession(order.whatsappId, {
        whatsappId: order.whatsappId,
        step: "completed",
        orderId: orderId,
        completedAt: new Date().toISOString(),
      })

      return res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Payment Successful</title>
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background: #f5f5f5; }
            .container { background: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); max-width: 500px; margin: 0 auto; }
            .success { color: #27ae60; font-size: 32px; margin-bottom: 20px; }
            .check { font-size: 48px; }
            .message { margin: 15px 0; font-size: 16px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="check">✅</div>
            <div class="success">Payment Successful!</div>
            <div class="message">Your application has been received.</div>
            <div class="message">Check WhatsApp for confirmation details.</div>
            <div class="message" style="margin-top: 30px; color: #7f8c8d;">You can close this window.</div>
          </div>
        </body>
        </html>
      `)
    } catch (error) {
      console.error("Payment success error:", error)
      return this.handleFailure(req, res)
    }
  }

  // Handle payment failure
  async handleFailure(req, res) {
    try {
      const { orderId } = req.query

      console.log("Payment failed for order:", orderId)

      if (orderId) {
        await database.updateOrder(orderId, {
          status: "failed",
          paymentStatus: "failed",
          failedAt: new Date().toISOString(),
        })

        const order = await database.findOrderByOrderId(orderId)
        if (order) {
          await whatsappService.sendTextMessage(
            order.whatsappId,
            `Payment failed for order ${orderId}. Please try again or contact support.`,
          )
        }
      }

      return res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Payment Failed</title>
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background: #f5f5f5; }
            .container { background: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); max-width: 500px; margin: 0 auto; }
            .error { color: #e74c3c; font-size: 32px; margin-bottom: 20px; }
            .x { font-size: 48px; }
            .message { margin: 15px 0; font-size: 16px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="x">❌</div>
            <div class="error">Payment Failed</div>
            <div class="message">Your payment could not be processed.</div>
            <div class="message">Please try again or contact support.</div>
            <div class="message" style="margin-top: 30px; color: #7f8c8d;">You can close this window.</div>
          </div>
        </body>
        </html>
      `)
    } catch (error) {
      console.error("Payment failure error:", error)
      res.status(500).json({ error: "Internal server error" })
    }
  }

  async sendPaymentConfirmation(whatsappId, order) {
    try {
      const message =
        `✅ Payment Successful!\n\n` +
        `Order ID: ${order.orderId}\n` +
        `Service: ${order.serviceType}\n` +
        `Amount: ₹${order.amount}\n` +
        `Date: ${new Date().toLocaleDateString("en-IN")}\n\n` +
        `Your application has been received. We'll process it within 24 hours.`

      await whatsappService.sendTextMessage(whatsappId, message)
    } catch (error) {
      logger.error("Error sending payment confirmation:", error)
    }
  }

  // Verify Razorpay payment signature
  async verifyPaymentSignature(orderId, paymentId, signature) {
    try {
      // In production, verify with Razorpay API
      // For now, accept all signatures (for testing)
      console.log("Verifying payment signature:", { orderId, paymentId })
      return true
    } catch (error) {
      logger.error("Error verifying payment:", error)
      return false
    }
  }

  // Create payment link for an order
  async createPaymentLink(orderId) {
    try {
      const order = await database.findOrderByOrderId(orderId)
      if (!order) {
        throw new Error("Order not found")
      }

      const baseUrl = process.env.BASE_URL || "http://localhost:3000"
      const paymentLink = `${baseUrl}/payment/checkout?orderId=${orderId}`

      console.log("Payment link created:", paymentLink)
      return paymentLink
    } catch (error) {
      logger.error("Error creating payment link:", error)
      throw error
    }
  }
}

module.exports = new PaymentController()
