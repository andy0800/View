// backend/src/routes/videos.js
const express = require('express');
const router = express.Router();
const { authenticate, authorizeRoles } = require('../middleware/authMiddleware');
const { 
  getSections, 
  getSectionAds, 
  getAllAdsRandomly,
  startWatchingAd, 
  completeWatchingAd, 
  getWatchHistory,
  getVideosBySection
} = require('../controllers/videoController');

// Routes that need authentication for filtering already watched videos
router.get('/sections', authenticate, getSections);
router.get('/sections/:sectionKey/ads', authenticate, getSectionAds);
router.get('/all-ads', authenticate, getAllAdsRandomly);

// Protected routes (viewer only)
router.use(authenticate, authorizeRoles('viewer'));

// Start watching an ad
router.post('/ads/:adId/start', startWatchingAd);

// Complete watching an ad
router.post('/ads/:adId/complete', completeWatchingAd);

// Get watch history
router.get('/history', getWatchHistory);

// Get videos by business section
router.get('/section/:sectionKey', getVideosBySection);

module.exports = router;