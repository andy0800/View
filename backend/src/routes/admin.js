// backend/src/routes/admin.js

const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/adminController');

// All endpoints guarded by adminAuth in server.js
router.get('/users',            ctrl.getUsers);
router.get('/kyc',              ctrl.getKycRequests);
router.patch('/kyc/:id',        ctrl.updateKyc);
router.get('/withdrawals',      ctrl.getWithdrawals);
router.patch('/withdrawals/:id',ctrl.updateWithdrawal);
router.get('/transactions',     ctrl.getTransactions);
router.get('/videos',           ctrl.getVideos);

module.exports = router;