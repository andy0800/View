const express = require('express');
const { authenticate } = require('../middleware/authMiddleware');
const { getBalance, redeemPoints } = require('../controllers/walletController');

const router = express.Router();

router.get('/balance', authenticate, getBalance);
router.post('/redeem', authenticate, redeemPoints);

module.exports = router;