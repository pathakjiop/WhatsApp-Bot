const WhatsAppService = require('../services/whatsapp.service');
const PaymentService = require('../services/payment.service');
const NotificationService = require('../services/notification.service');
const Order = require('../models/order.model');
const { generateOrderId } = require('../utils/helpers');
const logger = require('../utils/logger');

class PaymentController {
  async initiatePayment(from, order) {
    try {
      // Create Razorpay order
      const razorpayOrder = await PaymentService.createOrder(
        order.amount,
        order.orderId,
        {
          whatsappId: order.whatsappId,
          serviceType: order.serviceType,
        }
      );

      if (!razorpayOrder.success) {
        throw new Error('Failed to create payment order');
      }

      // Update order with Razorpay order ID
      order.razorpayOrderId = razorpayOrder.orderId;
      await order.save();

      // Generate payment link
      const userData = order.userData || {};
      const paymentLink = await PaymentService.generatePaymentLink(
        order.orderId,
        order.amount,
        userData.name || 'Customer',
        userData.email || '',
        from
      );

      if (!paymentLink.success) {
        throw new Error('Failed to generate payment link');
      }

      // Send payment link to user
      await this.sendPaymentMessage(from, order, paymentLink.paymentLink);
      
      logger.info('Payment initiated', {
        orderId: order.orderId,
        razorpayOrderId: razorpayOrder.orderId,
        amount: order.amount,
      });

      return {
        success: true,
        paymentLink: paymentLink.paymentLink,
        orderId: order.orderId,
      };
    } catch (error) {
      logger.error('Error initiating payment:', error);
      
      // Notify user of failure
      await WhatsAppService.sendTextMessage(
        from,
        '❌ Failed to create payment. Please try again or contact support.'
      );
      
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async sendPaymentMessage(to, order, paymentLink) {
    const amountInRupees = (order.amount / 100).toFixed(2);
    
    const message = `💰 Payment Required\n\n` +
      `Service: ${order.serviceType}\n` +
      `Amount: ₹${amountInRupees}\n` +
      `Order ID: ${order.orderId}\n\n` +
      `Please complete your payment using the link below:\n` +
      `${paymentLink}\n\n` +
      `⚠️ Note: Your application will be processed only after successful payment.`;

    await WhatsAppService.sendTextMessage(to, message);
  }

  async handlePaymentSuccess(orderId, paymentId, signature) {
    try {
      // Verify payment
      const verification = await PaymentService.verifyPayment(
        orderId,
        paymentId,
        signature
      );

      if (!verification.success) {
        throw new Error('Payment verification failed');
      }

      // Update order status
      const order = await Order.findOneAndUpdate(
        { razorpayOrderId: orderId },
        {
          status: 'completed',
          paymentStatus: 'captured',
          paymentId,
          completedAt: new Date(),
        },
        { new: true }
      );

      if (!order) {
        throw new Error('Order not found');
      }

      // Send success notifications
      await NotificationService.sendPaymentSuccessNotification(order.whatsappId, {
        orderId: order.orderId,
        serviceType: order.serviceType,
        amount: order.amount,
      });

      await NotificationService.sendApplicationSubmittedNotification(
        order.whatsappId,
        order.serviceType
      );

      logger.info('Payment handled successfully', {
        orderId: order.orderId,
        paymentId,
        amount: order.amount,
      });

      return {
        success: true,
        order,
      };
    } catch (error) {
      logger.error('Error handling payment success:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async handlePaymentFailure(orderId) {
    try {
      const order = await Order.findOneAndUpdate(
        { razorpayOrderId: orderId },
        {
          status: 'failed',
          paymentStatus: 'failed',
        },
        { new: true }
      );

      if (order) {
        await NotificationService.sendPaymentFailureNotification(
          order.whatsappId,
          order.orderId
        );
      }

      logger.info('Payment failure handled', { orderId });
      
      return {
        success: true,
        order,
      };
    } catch (error) {
      logger.error('Error handling payment failure:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }
}

module.exports = new PaymentController();