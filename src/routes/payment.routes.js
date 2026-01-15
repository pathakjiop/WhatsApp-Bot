const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/payment.controller');

router.get('/success', paymentController.handleSuccess);
router.get('/failure', paymentController.handleFailure);

module.exports = router;