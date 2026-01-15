const express = require("express")
const router = express.Router()
const paymentController = require("../controllers/payment.controller")

// Payment callback routes
router.get("/success", paymentController.handleSuccess.bind(paymentController))
router.get("/failure", paymentController.handleFailure.bind(paymentController))

// Payment checkout page
router.get("/checkout", (req, res) => {
  const { orderId, whatsappId } = req.query

  if (!orderId) {
    return res.status(400).send("Missing orderId parameter")
  }

  // In production, integrate with Razorpay SDK
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Checkout - Payment</title>
      <style>
        body { font-family: Arial, sans-serif; background: #f5f5f5; }
        .container { max-width: 600px; margin: 50px auto; background: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
        h1 { color: #2c3e50; }
        .order-info { background: #ecf0f1; padding: 15px; border-radius: 4px; margin: 20px 0; }
        .order-info p { margin: 10px 0; }
        .form-group { margin: 20px 0; }
        label { display: block; margin-bottom: 5px; font-weight: bold; color: #2c3e50; }
        input { width: 100%; padding: 10px; border: 1px solid #bdc3c7; border-radius: 4px; box-sizing: border-box; }
        button { background: #27ae60; color: white; padding: 12px 30px; border: none; border-radius: 4px; cursor: pointer; font-size: 16px; width: 100%; }
        button:hover { background: #229954; }
        .test-info { background: #fff3cd; padding: 10px; border-radius: 4px; margin: 20px 0; font-size: 14px; color: #856404; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>Secure Checkout</h1>
        <div class="order-info">
          <p><strong>Order ID:</strong> ${orderId}</p>
        </div>
        
        <div class="test-info">
          For testing purposes: Click "Pay Now" to simulate a successful payment.
        </div>

        <form method="GET" action="/payment/success">
          <input type="hidden" name="orderId" value="${orderId}">
          <input type="hidden" name="mock" value="true">
          <input type="hidden" name="paymentId" value="mock_payment_${Date.now()}">
          
          <div class="form-group">
            <label>Email</label>
            <input type="email" name="email" required>
          </div>
          
          <div class="form-group">
            <label>Card Number (test: 4111111111111111)</label>
            <input type="text" name="card" placeholder="4111111111111111" required>
          </div>
          
          <button type="submit">Pay Now</button>
        </form>
      </div>
    </body>
    </html>
  `)
})

module.exports = router
