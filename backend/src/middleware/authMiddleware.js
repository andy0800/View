// backend/src/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const { User, Session } = require('../models');

/**
 * Unified authentication middleware
 * Verifies JWT token from cookies or Bearer header
 * Loads full User record with role & kyc_status into req.user
 */
async function authenticate(req, res, next) {
  try {
    console.log('🔍 authenticate middleware called for:', req.path);
    
    // Extract token from cookies (preferred) or Bearer header
    let token = req.cookies?.token;
    
    if (!token && req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    console.log('🔍 Token found:', token ? 'Yes' : 'No');

    if (!token) {
      console.log('❌ No token found');
      return res.status(401).json({ message: 'Authentication token required' });
    }

    // Verify JWT token - use environment variable only
    const jwtSecret = process.env.JWT_SECRET || '2d8ea8f818adbb33b8d878efb2b13cad8b9c256eb6330773c201dfb36c2cfd0b';
    const payload = jwt.verify(token, jwtSecret.trim());
    
    console.log('🔍 JWT payload:', payload);
    
    // Handle admin user specially (admin has id: 0 or admin UUID)
    const adminUuid = '00000000-0000-0000-0000-000000000000';
    if (payload.role === 'admin' && (payload.id === 0 || payload.id === adminUuid)) {
      req.user = { id: payload.id, role: 'admin', kyc_status: 'verified' };
      req.userRole = 'admin';
      console.log('✅ Admin user authenticated with ID:', payload.id);
      return next();
    }
    
    // For non-admin users, ensure there is an active session for this token
    let sessionRecord;
    try {
      sessionRecord = await Session.findOne({
        where: {
          token,
          is_active: true,
          expires_at: { [Op.gt]: new Date() }
        }
      });
    } catch (dbError) {
      console.error('❌ Database error during session lookup:', dbError);
      return res.status(503).json({ 
        success: false,
        message: 'Authentication service temporarily unavailable',
        error: 'SERVICE_UNAVAILABLE'
      });
    }
    
    if (!sessionRecord) {
      console.log('❌ No active session found for token');
      return res.status(401).json({ 
        success: false,
        message: 'Invalid or expired session',
        error: 'SESSION_INVALID'
      });
    }
    
    // Find user by ID for regular users
    let user;
    try {
      user = await User.findByPk(payload.id);
    } catch (dbError) {
      console.error('❌ Database error during user lookup:', dbError);
      return res.status(503).json({ 
        success: false,
        message: 'Authentication service temporarily unavailable',
        error: 'SERVICE_UNAVAILABLE'
      });
    }
    
    console.log('🔍 User found:', user ? {
      id: user.id,
      role: user.role,
      kyc_status: user.kyc_status
    } : 'Not found');
    
    if (!user) {
      console.log('❌ User not found for ID:', payload.id);
      return res.status(401).json({ 
        success: false,
        message: 'User account not found or has been removed',
        error: 'USER_NOT_FOUND'
      });
    }

    // Attach user and role to request
    req.user = user;
    req.userRole = user.role;
    req.sessionId = sessionRecord.id;
    req.token = token;
    
    console.log('✅ User authenticated:', {
      id: user.id,
      role: user.role,
      kyc_status: user.kyc_status
    });
    
    next();
  } catch (err) {
    console.error('❌ Authentication error:', err.message);
    
    // Handle specific JWT errors gracefully
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false,
        message: 'Invalid authentication token',
        error: 'TOKEN_INVALID'
      });
    }
    
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false,
        message: 'Authentication token has expired',
        error: 'TOKEN_EXPIRED'
      });
    }
    
    // Handle database/user lookup errors gracefully
    if (err.name === 'SequelizeDatabaseError' || err.name === 'SequelizeConnectionError') {
      console.error('❌ Database error during authentication:', err);
      return res.status(503).json({ 
        success: false,
        message: 'Authentication service temporarily unavailable',
        error: 'SERVICE_UNAVAILABLE'
      });
    }
    
    // Handle any other unexpected errors gracefully
    console.error('❌ Unexpected authentication error:', err);
    return res.status(401).json({ 
      success: false,
      message: 'Authentication failed',
      error: 'AUTH_FAILED'
    });
  }
}

/**
 * Role-based authorization middleware
 * Restricts access to specified roles
 */
function authorizeRoles(...allowedRoles) {
  return (req, res, next) => {
    console.log('🔍 authorizeRoles called for:', req.path);
    console.log('🔍 User role:', req.userRole);
    console.log('🔍 Allowed roles:', allowedRoles);
    
    if (!req.user || !req.userRole) {
      console.log('❌ No user or userRole found');
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    if (!allowedRoles.includes(req.userRole)) {
      console.log('❌ Access denied. User role not in allowed roles');
      return res.status(403).json({ 
        message: `Access denied. Required roles: ${allowedRoles.join(', ')}` 
      });
    }
    
    console.log('✅ Role authorization passed');
    next();
  };
}

/**
 * KYC verification middleware for advertisers
 * Blocks advertisers whose KYC status isn't "verified"
 */
function requireKyc(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  
  if (req.user.role === 'advertiser' && req.user.kyc_status !== 'verified') {
    return res.status(403).json({ 
      message: 'Advertiser KYC verification required. Please complete verification process.' 
    });
  }
  
  next();
}

/**
 * Phone number validation middleware
 * Ensures phone number follows Kuwait format
 */
function validateKuwaitPhone(phone) {
  const kuwaitPhoneRegex = /^\+965[569]\d{7}$/;
  return kuwaitPhoneRegex.test(phone);
}

/**
 * Civil ID validation middleware
 * Ensures civil ID follows Kuwait format
 */
function validateCivilId(civilId) {
  const civilIdRegex = /^\d{12}$/;
  return civilIdRegex.test(civilId);
}

module.exports = { 
  authenticate, 
  authorizeRoles, 
  requireKyc,
  validateKuwaitPhone,
  validateCivilId
};