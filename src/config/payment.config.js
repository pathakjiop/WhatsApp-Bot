require('dotenv').config();

module.exports = {
  razorpayKeyId: process.env.RAZORPAY_KEY_ID,
  razorpayKeySecret: process.env.RAZORPAY_KEY_SECRET,
  webhookSecret: process.env.WEBHOOK_SECRET,
  currency: 'INR',
  paymentSuccessUrl: `${process.env.BASE_URL}/payment/success`,
  paymentFailureUrl: `${process.env.BASE_URL}/payment/failure`,
};