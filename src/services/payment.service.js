const Razorpay = require('razorpay');
const paymentConfig = require('../config/payment.config');
const { generateRazorpayOrderId, verifyPaymentSignature } = require('../utils/helpers');
const logger = require('../utils/logger');

class PaymentService {
  constructor() {
    this.razorpay = new Razorpay({
      key_id: paymentConfig.razorpayKeyId,
      key_secret: paymentConfig.razorpayKeySecret,
    });
  }

  async createOrder(amount, receipt, notes = {}) {
    try {
      const options = {
        amount: amount, // amount in smallest currency unit (paise for INR)
        currency: paymentConfig.currency,
        receipt: receipt,
        notes,
      };

      const order = await this.razorpay.orders.create(options);
      logger.info('Razorpay order created:', { orderId: order.id });
      
      return {
        success: true,
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        receipt: order.receipt,
      };
    } catch (error) {
      logger.error('Error creating Razorpay order:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async verifyPayment(orderId, paymentId, signature) {
    try {
      const isValid = verifyPaymentSignature(
        orderId,
        paymentId,
        signature,
        paymentConfig.razorpayKeySecret
      );

      if (!isValid) {
        return {
          success: false,
          error: 'Invalid payment signature',
        };
      }

      // Fetch payment details from Razorpay
      const payment = await this.razorpay.payments.fetch(paymentId);
      
      return {
        success: true,
        payment,
      };
    } catch (error) {
      logger.error('Error verifying payment:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async capturePayment(paymentId, amount) {
    try {
      const payment = await this.razorpay.payments.capture(paymentId, amount);
      return {
        success: true,
        payment,
      };
    } catch (error) {
      logger.error('Error capturing payment:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async generatePaymentLink(orderId, amount, customerName, customerEmail, customerPhone) {
    try {
      const paymentLink = await this.razorpay.paymentLink.create({
        amount: amount,
        currency: paymentConfig.currency,
        accept_partial: false,
        reference_id: orderId,
        description: 'Payment for Land Record Service',
        customer: {
          name: customerName,
          email: customerEmail,
          contact: customerPhone,
        },
        notify: {
          sms: true,
          email: true,
        },
        reminder_enable: true,
        callback_url: paymentConfig.paymentSuccessUrl,
        callback_method: 'get',
      });

      return {
        success: true,
        paymentLink: paymentLink.short_url,
        paymentLinkId: paymentLink.id,
      };
    } catch (error) {
      logger.error('Error generating payment link:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }
}

module.exports = new PaymentService();