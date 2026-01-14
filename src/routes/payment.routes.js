const express = require('express');
const router = express.Router();
const { verifyRazorpayWebhook } = require('../middlewares/auth.middleware');
const PaymentController = require('../controllers/payment.controller');

// Payment success callback
router.get('/success', async (req, res) => {
  try {
    const { order_id, payment_id, signature } = req.query;
    
    if (!order_id || !payment_id || !signature) {
      return res.status(400).send('Missing required parameters');
    }

    const result = await PaymentController.handlePaymentSuccess(
      order_id,
      payment_id,
      signature
    );

    if (result.success) {
      res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Payment Successful</title>
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
            .success { color: #4CAF50; font-size: 24px; }
            .message { margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="success">✅ Payment Successful!</div>
          <div class="message">Your payment has been processed successfully.</div>
          <div class="message">You will receive a confirmation on WhatsApp shortly.</div>
          <div class="message">You can close this window.</div>
        </body>
        </html>
      `);
    } else {
      res.status(400).send('Payment verification failed');
    }
  } catch (error) {
    console.error('Payment success callback error:', error);
    res.status(500).send('Internal server error');
  }
});

// Payment failure callback
router.get('/failure', async (req, res) => {
  try {
    const { order_id } = req.query;
    
    if (order_id) {
      await PaymentController.handlePaymentFailure(order_id);
    }

    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Payment Failed</title>
        <style>
          body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
          .error { color: #f44336; font-size: 24px; }
          .message { margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="error">❌ Payment Failed</div>
        <div class="message">Your payment could not be processed.</div>
        <div class="message">Please try again or contact support.</div>
        <div class="message">You can close this window.</div>
      </body>
      </html>
    `);
  } catch (error) {
    console.error('Payment failure callback error:', error);
    res.status(500).send('Internal server error');
  }
});

// Razorpay webhook
router.post('/webhook', verifyRazorpayWebhook, async (req, res) => {
  try {
    const event = req.body.event;
    const payload = req.body.payload;

    if (event === 'payment.captured') {
      const payment = payload.payment.entity;
      
      await PaymentController.handlePaymentSuccess(
        payment.order_id,
        payment.id,
        '' // Signature not available in webhook
      );
    } else if (event === 'payment.failed') {
      const payment = payload.payment.entity;
      
      await PaymentController.handlePaymentFailure(payment.order_id);
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Razorpay webhook error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;