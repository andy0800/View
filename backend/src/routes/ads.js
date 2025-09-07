// backend/src/routes/ads.js
// Ad routes including verification system

const express = require('express');
const router = express.Router();
const { authenticate, authorizeRoles } = require('../middleware/authMiddleware');
const {
  submitAdForReview,
  submitAppeal,
  getAdVerificationStatus,
  getAdvertiserAds
} = require('../controllers/adController');

// Apply authentication to all routes
router.use(authenticate);

// Verification system routes (advertisers only)
router.post('/:id/submit-for-review', authorizeRoles('advertiser'), submitAdForReview);
router.post('/:id/appeal', authorizeRoles('advertiser'), submitAppeal);
router.get('/:id/verification-status', authorizeRoles('advertiser'), getAdVerificationStatus);
router.get('/advertiser/ads', authorizeRoles('advertiser'), getAdvertiserAds);

module.exports = router;