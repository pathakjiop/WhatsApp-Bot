const express = require('express');
const router = express.Router();
const webhookController = require('../controllers/webhook.controller');

router.get('/', webhookController.verify);
router.post('/', webhookController.handleWebhook);

module.exports = router;
