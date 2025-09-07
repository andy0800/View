// backend/src/routes/admin.js
// Admin routes for ad verification and management

const express = require('express');
const router = express.Router();
const { authenticate, authorizeRoles } = require('../middleware/authMiddleware');
const {
  getPendingReviewAds,
  getAdVerificationHistory,
  approveAd,
  rejectAd,
  getPendingAppeals,
  handleAppeal,
  getVerificationStats,
  getAllUsers,
  getAllVideos,
  getAllTransactions,
  getAllWithdrawals,
  getKycRequests,
  updateKycStatus,
  updateAdStatus,
  updateWithdrawalStatus,
  getKycStats,
  getCompanyEarnings,
  getAdminSettings,
  updateAdminSettings,
  getPendingNotificationsCount,
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead
} = require('../controllers/adminController');

// Apply authentication and admin role requirement to all routes
router.use(authenticate);
router.use(authorizeRoles('admin'));

// Ad verification routes
router.get('/ads/pending-review', getPendingReviewAds);
router.get('/ads/:id/verification-history', getAdVerificationHistory);
router.post('/ads/:id/approve', approveAd);
router.post('/ads/:id/reject', rejectAd);

// Admin status control routes (pause/play approved ads)
router.put('/ads/:id/status', updateAdStatus);

// Appeal management routes
router.get('/appeals', getPendingAppeals);
router.post('/appeals/:appeal_id/process', handleAppeal);

// Verification statistics
router.get('/verification-stats', getVerificationStats);

// User management routes
router.get('/users', getAllUsers);

// Video management routes
router.get('/videos', getAllVideos);

// Transaction management routes
router.get('/transactions', getAllTransactions);

// Withdrawal management routes
router.get('/withdrawals', getAllWithdrawals);
router.patch('/withdrawals/:id', updateWithdrawalStatus);

// Company earnings route
router.get('/company/earnings', getCompanyEarnings);

// KYC verification routes
router.get('/kyc', getKycRequests);
router.get('/kyc/stats', getKycStats);
router.patch('/kyc/:id', updateKycStatus);

// Admin settings routes
router.get('/settings', getAdminSettings);
router.put('/settings', updateAdminSettings);

// Admin notifications routes
router.get('/notifications/pending-count', getPendingNotificationsCount);
router.get('/notifications', getNotifications);
router.patch('/notifications/:id/read', markNotificationAsRead);
router.patch('/notifications/mark-all-read', markAllNotificationsAsRead);

module.exports = router;