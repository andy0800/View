// backend/src/routes/ads.js

const express = require('express');
const router  = express.Router();

// Controller functions
const {
  getAds,
  listPackages,
  purchasePackage,
  uploadAd,
  getCredit,
  withdrawCredit
} = require('../controllers/adController');

// Auth & role/KYC middleware
const {
  authMiddleware,
  authorizeRoles,
  requireKyc
} = require('../middleware/auth');

// File upload util
const { upload } = require('../utils/upload');

// 1) List all ads (advertiser only)
router.get(
  '/',
  authMiddleware,
  authorizeRoles('advertiser'),
  getAds
);

// 2) List available packages
router.get(
  '/packages',
  authMiddleware,
  authorizeRoles('advertiser'),
  listPackages
);

// 3) Purchase a package
router.post(
  '/purchase',
  authMiddleware,
  authorizeRoles('advertiser'),
  requireKyc,
  purchasePackage
);

// 4) Upload a new ad creative
router.post(
  '/upload',
  authMiddleware,
  authorizeRoles('advertiser'),
  requireKyc,
  upload.single('media'),
  uploadAd
);

// 5) View current wallet balance
router.get(
  '/credit',
  authMiddleware,
  authorizeRoles('advertiser'),
  getCredit
);

// 6) Withdraw from wallet
router.post(
  '/withdraw',
  authMiddleware,
  authorizeRoles('advertiser'),
  requireKyc,
  withdrawCredit
);

module.exports = router;