const WhatsAppService = require('./whatsapp.service');
const paymentConfig = require('../config/payment.config');
const logger = require('../utils/logger');

class NotificationService {
  async sendPaymentSuccessNotification(phoneNumber, orderDetails) {
    try {
      const message = `✅ Payment Successful!\n\n` +
        `Order ID: ${orderDetails.orderId}\n` +
        `Service: ${orderDetails.serviceType}\n` +
        `Amount: ₹${orderDetails.amount / 100}\n` +
        `Date: ${new Date().toLocaleDateString('en-IN')}\n\n` +
        `Your application has been received and is being processed.`;

      await WhatsAppService.sendTextMessage(phoneNumber, message);
      logger.info('Payment success notification sent', { phoneNumber, orderId: orderDetails.orderId });
    } catch (error) {
      logger.error('Error sending payment success notification:', error);
    }
  }

  async sendPaymentFailureNotification(phoneNumber, orderId) {
    try {
      const message = `❌ Payment Failed\n\n` +
        `Your payment for order ${orderId} has failed. Please try again or contact support.`;

      await WhatsAppService.sendTextMessage(phoneNumber, message);
      logger.info('Payment failure notification sent', { phoneNumber, orderId });
    } catch (error) {
      logger.error('Error sending payment failure notification:', error);
    }
  }

  async sendApplicationSubmittedNotification(phoneNumber, serviceType) {
    try {
      const message = `✅ Application Submitted Successfully!\n\n` +
        `Your ${serviceType} application has been submitted. ` +
        `Our team will process it within 24-48 hours. ` +
        `You will receive updates on this WhatsApp number.`;

      await WhatsAppService.sendTextMessage(phoneNumber, message);
      logger.info('Application submitted notification sent', { phoneNumber, serviceType });
    } catch (error) {
      logger.error('Error sending application submitted notification:', error);
    }
  }

  async sendOrderConfirmation(phoneNumber, order) {
    try {
      const receiptUrl = `${paymentConfig.paymentSuccessUrl}?order_id=${order.orderId}`;
      
      const message = `📋 Order Confirmation\n\n` +
        `Order ID: ${order.orderId}\n` +
        `Service: ${order.serviceType}\n` +
        `Amount: ₹${order.amount / 100}\n` +
        `Status: ${order.status}\n` +
        `Date: ${new Date(order.createdAt).toLocaleDateString('en-IN')}\n\n` +
        `View receipt: ${receiptUrl}`;

      await WhatsAppService.sendTextMessage(phoneNumber, message);
      logger.info('Order confirmation sent', { phoneNumber, orderId: order.orderId });
    } catch (error) {
      logger.error('Error sending order confirmation:', error);
    }
  }
}

module.exports = new NotificationService();