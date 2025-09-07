// backend/src/routes/advertiser.js
const express = require('express');
const router = express.Router();
const { upload } = require('../utils/upload');
const { authenticate, authorizeRoles } = require('../middleware/authMiddleware');
const { 
  getPackages,
  purchasePackage,
  createAd,
  getAds,
  getAdStats,
  toggleAdStatus,
  getDashboardStats,
  getPurchasedPackages,
  updateProfile
} = require('../controllers/advertiserController');

// Import additional controllers
const { getBalance, redeemPoints, getTransactions } = require('../controllers/walletController');
const { getCurrentUser } = require('../controllers/authController');

// Package management
router.get('/packages', authenticate, authorizeRoles('advertiser'), getPackages);
router.post('/packages/purchase', authenticate, authorizeRoles('advertiser'), purchasePackage);
router.get('/packages/purchased', authenticate, authorizeRoles('advertiser'), getPurchasedPackages);

// Ad management
router.get('/ads', authenticate, authorizeRoles('advertiser'), getAds);
router.post('/ads/create', authenticate, authorizeRoles('advertiser'), upload.single('media'), createAd);
router.get('/ads/:adId/stats', authenticate, authorizeRoles('advertiser'), getAdStats);
router.put('/ads/:adId/status', authenticate, authorizeRoles('advertiser'), toggleAdStatus);

// Dashboard
router.get('/dashboard', authenticate, authorizeRoles('advertiser'), getDashboardStats);

// Profile management
router.get('/profile', authenticate, authorizeRoles('advertiser'), getCurrentUser);
router.put('/profile', authenticate, authorizeRoles('advertiser'), updateProfile);

// Credit management (these are handled by the main wallet routes)
router.get('/credit', authenticate, authorizeRoles('advertiser'), getBalance);
router.get('/credit/transactions', authenticate, authorizeRoles('advertiser'), getTransactions);
router.post('/credit/deposit', authenticate, authorizeRoles('advertiser'), (req, res) => res.status(501).json({ message: 'Use /api/payment/deposit' }));
router.post('/credit/withdraw', authenticate, authorizeRoles('advertiser'), redeemPoints);

module.exports = router;