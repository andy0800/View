// backend/src/routes/wallet.js
const express = require('express');
const { authenticate } = require('../middleware/authMiddleware');
const { getBalance, redeemPoints, getTransactions } = require('../controllers/walletController');
const { Transaction } = require('../models');

const router = express.Router();

/**
 * @route   GET /api/wallet
 * @desc    Get the viewer wallet balance
 * @access  Private (Viewer)
 */
router.get('/', authenticate, getBalance);

/**
 * @route   POST /api/wallet/redeem
 * @desc    Submit withdrawal request
 * @access  Private (Viewer)
 */
router.post('/redeem', authenticate, redeemPoints);

// Legacy reward endpoint removed; view completion handled via /api/viewer/ads/:adId/complete

/**
 * @route   GET /api/wallet/transactions
 * @desc    Get user's transaction history
 * @access  Private
 */
router.get('/transactions', authenticate, getTransactions);

/**
 * @route   POST /api/wallet/withdraw
 * @desc    Submit withdrawal request
 * @access  Private
 */
router.post('/withdraw', authenticate, redeemPoints);

module.exports = router;