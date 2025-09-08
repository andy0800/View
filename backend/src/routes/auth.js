// backend/src/routes/auth.js

const express = require('express');
const multer = require('multer');
const path = require('path');
const authController = require('../controllers/authController');
const SessionService = require('../services/sessionService');
const { authenticate } = require('../middleware/authMiddleware');

const router = express.Router();

// Emergency disable flag for session endpoint
let sessionEndpointDisabled = false;

// Rate limiting for session endpoint
const sessionCallCounts = new Map();
const SESSION_RATE_LIMIT = 20; // Increased from 5 to 20 calls per minute per IP
const SESSION_RATE_WINDOW = 60000; // 1 minute window

// Rate limiting middleware for session endpoint
const sessionRateLimiter = (req, res, next) => {
  if (sessionEndpointDisabled) {
    console.log('🚫 Session endpoint emergency disabled');
    return res.status(503).json({ message: 'Session service temporarily unavailable' });
  }

  const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
  const now = Date.now();
  
  if (!sessionCallCounts.has(clientIP)) {
    sessionCallCounts.set(clientIP, { count: 1, firstCall: now });
  } else {
    const clientData = sessionCallCounts.get(clientIP);
    
    // Reset if window has passed
    if (now - clientData.firstCall > SESSION_RATE_WINDOW) {
      clientData.count = 1;
      clientData.firstCall = now;
    } else {
      clientData.count++;
      
      // Check if rate limit exceeded
      if (clientData.count > SESSION_RATE_LIMIT) {
        console.log(`🚫 Rate limit exceeded for IP: ${clientIP} (${clientData.count} calls)`);
        return res.status(429).json({ 
          message: 'Too many session requests. Please wait before trying again.',
          retryAfter: Math.ceil((SESSION_RATE_WINDOW - (now - clientData.firstCall)) / 1000)
        });
      }
    }
  }
  
  next();
};

// Setup multer for file uploads
const upload = multer({
  dest: path.join(__dirname, '../uploads')
});

// ─────────────────────────────────────────────
// 1) OTP Login Routes
// ─────────────────────────────────────────────
router.post('/request-otp', authController.requestOtp);
router.post('/verify-otp', authController.verifyOtp);

router.get('/request-otp', (_, res) => {
  res.status(405).json({ message: 'Use POST method for /request-otp' });
});
router.get('/verify-otp', (_, res) => {
  res.status(405).json({ message: 'Use POST method for /verify-otp' });
});

// ─────────────────────────────────────────────
// 2) Admin Login (BYPASS RATE LIMITING)
// ─────────────────────────────────────────────
router.post('/admin-login', (req, res) => {
  console.log('🔍 Admin login route hit');
  console.log('🔍 Request body:', req.body);
  
  // Simple admin login for backward compatibility
  const { username, password } = req.body;
  
  // Default admin credentials (you can change these)
  const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin@example.com';
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'ChangeMe123';
  
  console.log('🔍 Admin login attempt:', { 
    receivedUsername: username, 
    receivedPassword: password,
    expectedUsername: ADMIN_USERNAME,
    expectedPassword: ADMIN_PASSWORD,
    usernameMatch: username === ADMIN_USERNAME,
    passwordMatch: password === ADMIN_PASSWORD
  });
  
  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    const jwt = require('jsonwebtoken');
    
    // Ensure JWT_SECRET is available
    const jwtSecret = process.env.JWT_SECRET || '2d8ea8f818adbb33b8d878efb2b13cad8b9c256eb6330773c201dfb36c2cfd0b';
    
    const token = jwt.sign(
      { id: 0, role: 'admin' },
      jwtSecret.trim(),
      { expiresIn: '7d' }
    );

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.json({
      user: { id: 0, role: 'admin', kyc_status: 'verified' },
      token: token // Include token for testing purposes
    });
  } else {
    res.status(401).json({ message: 'Invalid admin credentials' });
  }
});

// ─────────────────────────────────────────────
// 3) Viewer Registration
// ─────────────────────────────────────────────
router.post(
  '/register-viewer',
  upload.fields([
    { name: 'civil_front', maxCount: 1 },
    { name: 'civil_back', maxCount: 1 }
  ]),
  authController.registerViewer
);

// ─────────────────────────────────────────────
// 4) Advertiser Registration
// ─────────────────────────────────────────────
router.post(
  '/register-advertiser',
  upload.fields([
    { name: 'license_doc', maxCount: 1 }
  ]),
  authController.registerAdvertiser
);

// ─────────────────────────────────────────────
// 5) Generic Registration (handles both user types)
// ─────────────────────────────────────────────
router.post(
  '/register',
  upload.fields([
    { name: 'civilIdFront', maxCount: 1 },
    { name: 'civilIdBack', maxCount: 1 },
    { name: 'licenseDocument', maxCount: 1 }
  ]),
  authController.register
);

// ─────────────────────────────────────────────
// 6) Logout
// ─────────────────────────────────────────────
router.post('/logout', authController.logout);

// ─────────────────────────────────────────────
// 6) Session Check with IP Validation + Rate Limiting
// ─────────────────────────────────────────────
router.get('/session', sessionRateLimiter, authenticate, async (req, res, next) => {
  try {
    // User already authenticated by middleware; delegate to controller
    console.log('🔍 Session endpoint called (rate limited, authenticated)');
    next();
  } catch (err) {
    console.error('❌ Session validation error:', err);
    return res.status(401).json({ message: 'Session validation failed' });
  }
}, authController.getCurrentUser);

// Emergency disable function for session endpoint
function disableSessionEndpoint() {
  sessionEndpointDisabled = true;
  console.log('🚫 Session endpoint emergency disabled');
}

function enableSessionEndpoint() {
  sessionEndpointDisabled = false;
  console.log('✅ Session endpoint emergency enabled');
}

// ─────────────────────────────────────────────
// 7) Session Management Routes
// ─────────────────────────────────────────────
router.get('/sessions', authController.getUserSessions);
router.delete('/sessions/:sessionId', authController.invalidateSession);

// Export the disable functions
module.exports = { router, disableSessionEndpoint, enableSessionEndpoint };