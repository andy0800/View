// backend/src/routes/company.js
const express = require('express');
const router = express.Router();
const { authenticate, authorizeRoles } = require('../middleware/authMiddleware');
const { getCompanyDashboard, getCompanyTransactions } = require('../controllers/companyController');

// Company dashboard - only accessible by admins
router.get('/dashboard', 
  authenticate, 
  authorizeRoles('admin'), 
  getCompanyDashboard
);

// Company transactions - only accessible by admins
router.get('/transactions', 
  authenticate, 
  authorizeRoles('admin'), 
  getCompanyTransactions
);

module.exports = router;
