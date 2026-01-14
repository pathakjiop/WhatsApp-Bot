const crypto = require('crypto');

const generateOrderId = () => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `ORD_${timestamp}_${random}`.toUpperCase();
};

const generateRazorpayOrderId = () => {
  return `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

const verifyPaymentSignature = (orderId, paymentId, signature, secret) => {
  const body = orderId + '|' + paymentId;
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(body.toString())
    .digest('hex');
  
  return expectedSignature === signature;
};

const getServiceAmount = (serviceType) => {
  const prices = {
    '8A': 10000, // 100 INR in paise
    '7/12': 5000,
    'Ferfar': 3000,
    'Property Card': 2000,
  };
  return prices[serviceType] || 10000;
};

const formatPhoneNumber = (phoneNumber) => {
  // Remove any non-digit characters
  const cleaned = phoneNumber.replace(/\D/g, '');
  
  // Ensure it starts with country code
  if (cleaned.startsWith('0')) {
    return `91${cleaned.substring(1)}`;
  }
  
  if (cleaned.length === 10) {
    return `91${cleaned}`;
  }
  
  return cleaned;
};

module.exports = {
  generateOrderId,
  generateRazorpayOrderId,
  verifyPaymentSignature,
  getServiceAmount,
  formatPhoneNumber,
};