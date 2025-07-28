const express = require('express');
const { authenticate, authorizeRoles } = require('../middleware/authMiddleware');
const router = express.Router();
const {
  createDepositIntent,
  handleWebhook
} = require('../controllers/paymentController');

// Advertiser deposit
router.post(
  '/create-intent',
  authenticate,
  authorizeRoles('advertiser'),
  createDepositIntent
);

// Stripe webhook (no auth)
router.post(
  '/webhook',
  express.raw({ type: 'application/json' }),
  handleWebhook
);

module.exports = router;