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

// Simple deposit request (for testing)
router.post(
  '/deposit',
  authenticate,
  authorizeRoles('advertiser'),
  async (req, res) => {
    try {
      const { amount, method } = req.body;
      
      if (!amount || amount < 10) {
        return res.status(400).json({ message: 'Minimum deposit amount is 10 KWD' });
      }

      // Create a pending transaction
      const { Transaction } = require('../models');
      await Transaction.create({
        user_id: req.user.id,
        type: 'deposit',
        amount: amount,
        description: `Deposit request via ${method}`,
        status: 'pending'
      });

      res.json({ 
        message: 'Deposit request submitted successfully',
        amount: amount,
        method: method
      });
    } catch (error) {
      console.error('Error creating deposit:', error);
      res.status(500).json({ message: 'Failed to create deposit request' });
    }
  }
);

// Stripe webhook (no auth)
router.post(
  '/webhook',
  express.raw({ type: 'application/json' }),
  handleWebhook
);

module.exports = router;