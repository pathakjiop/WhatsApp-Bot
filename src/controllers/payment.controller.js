const database = require('../services/database.service');
const notificationService = require('../services/notification.service');
const paymentService = require('../services/payment.service');

class PaymentController {
  async handleSuccess(req, res) {
    try {
      const { order_id, payment_id, signature, mock, amount, service } = req.query;
      
      console.log('💰 Payment success callback:', req.query);
      
      if (mock === 'true') {
        // Mock payment for testing
        const order = await database.findOrderByOrderId(order_id);
        
        if (order) {
          // Update order status
          await database.updateOrder(order_id, {
            status: 'completed',
            paymentStatus: 'captured',
            paymentId: payment_id || `mock_${Date.now()}`,
            completedAt: new Date().toISOString()
          });
          
          // Send confirmation
          await notificationService.sendPaymentConfirmation(order.whatsappId, {
            orderId: order.orderId,
            service: order.service,
            amount: order.amount
          });
        }
        
        return res.send(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>Payment Successful</title>
            <style>
              body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
              .success { color: green; font-size: 24px; }
              .message { margin: 20px 0; }
            </style>
          </head>
          <body>
            <div class="success">✅ Payment Successful!</div>
            <div class="message">Order ID: ${order_id}</div>
            <div class="message">Amount: ₹${amount || '100'}</div>
            <div class="message">Service: ${service || 'Land Record'}</div>
            <div class="message">You will receive confirmation on WhatsApp.</div>
            <div class="message">You can close this window.</div>
          </body>
          </html>
        `);
      }
      
      // Real payment verification (not implemented in this version)
      const verification = await paymentService.verifyPayment(order_id, payment_id, signature);
      
      if (verification.success) {
        const order = await database.findOrderByOrderId(order_id);
        
        if (order) {
          await database.updateOrder(order_id, {
            status: 'completed',
            paymentStatus: 'captured',
            paymentId: payment_id,
            completedAt: new Date().toISOString()
          });
          
          await notificationService.sendPaymentConfirmation(order.whatsappId, {
            orderId: order.orderId,
            service: order.service,
            amount: order.amount
          });
        }
        
        return res.send(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>Payment Successful</title>
            <style>
              body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
              .success { color: green; font-size: 24px; }
            </style>
          </head>
          <body>
            <div class="success">✅ Payment Successful!</div>
            <div class="message">You will receive confirmation on WhatsApp.</div>
          </body>
          </html>
        `);
      } else {
        return this.handleFailure(req, res);
      }
      
    } catch (error) {
      console.error('Payment success error:', error);
      return this.handleFailure(req, res);
    }
  }

  async handleFailure(req, res) {
    const { order_id } = req.query;
    
    console.log('❌ Payment failed for order:', order_id);
    
    if (order_id) {
      await database.updateOrder(order_id, {
        status: 'failed',
        paymentStatus: 'failed'
      });
    }
    
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Payment Failed</title>
        <style>
          body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
          .error { color: red; font-size: 24px; }
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
  }
}

module.exports = new PaymentController();