// ⚠️ DELEGATE ONLY — MUST NOT GRANT VIEW REWARDS
const express = require('express');
const router = express.Router();
const {
  getProfile,
  getSections,
  getSectionVideos,
  getAllAds,
  getViewerStats,
  completeView,
  startWatchingAd
} = require('../controllers/viewerController');
const { authenticate, authorizeRoles } = require('../middleware/authMiddleware');

// ✅ GET /api/viewer/profile - Get viewer profile
router.get('/profile', authenticate, authorizeRoles('viewer'), getProfile);

// ✅ GET /api/viewer/sections - Get all business sections
router.get('/sections', authenticate, authorizeRoles('viewer'), getSections);

// ✅ GET /api/viewer/sections/:key/videos - Get videos for a specific section
router.get('/sections/:key/videos', authenticate, authorizeRoles('viewer'), getSectionVideos);

// ✅ GET /api/viewer/all-ads - Get all ads randomly
router.get('/all-ads', authenticate, authorizeRoles('viewer'), getAllAds);

// ✅ POST /api/viewer/ads/:adId/start - Start watching an ad
router.post('/ads/:adId/start', async (req, res) => {
  // Redirect to video controller for consistency
  const { startWatchingAd } = require('../controllers/videoController');
  return startWatchingAd(req, res);
});

// ✅ POST /api/viewer/ads/:adId/complete - Complete video view and get reward
router.post('/ads/:adId/complete', async (req, res) => {
  // Redirect to video controller for consistency
  const { completeWatchingAd } = require('../controllers/videoController');
  return completeWatchingAd(req, res);
 });

// ✅ POST /api/viewer/wallet/reward - Reward viewer for watching video (new endpoint)
router.post('/wallet/reward', async (req, res) => {
  // Redirect to video controller for consistency
  const { completeWatchingAd } = require('../controllers/videoController');
  // Extract adId from request body
  const { adId } = req.body;
  if (!adId) {
    return res.status(400).json({ message: 'Ad ID is required' });
  }
  // Set adId in params for the video controller
  req.params.adId = adId;
  return completeWatchingAd(req, res);
});

// ✅ GET /api/viewer/stats - Get viewer statistics
router.get('/stats', authenticate, authorizeRoles('viewer'), getViewerStats);

// Optional test endpoint
router.get('/test', (req, res) => {
  res.send('Viewer routes are working ✅');
});

module.exports = router;