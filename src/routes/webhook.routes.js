const express = require('express');
const router = express.Router();
const WebhookController = require('../controllers/webhook.controller');

router.get('/', WebhookController.verify);
router.post('/', WebhookController.handleWebhook);

module.exports = router;