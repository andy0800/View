'use strict';

const jwt  = require('jsonwebtoken');
const { User } = require('../models');

/**
 * Verifies HTTP-only cookie “token”, falls back to Bearer header.
 * Loads full User record (with role & kyc_status) into req.user.
 */
async function authMiddleware(req, res, next) {
  try {
    let token = req.cookies?.token;

    if (!token && req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET.trim());
    const user    = await User.findByPk(payload.id);

    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error('Auth error:', err.message);
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}

/**
 * Restricts access to one or more roles.
 */
function authorizeRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden: insufficient rights' });
    }
    next();
  };
}

/**
 * Blocks advertisers whose KYC status isn’t “verified”.
 */
function requireKyc(req, res, next) {
  if (
    req.user.role === 'advertiser' &&
    req.user.kyc_status !== 'verified'
  ) {
    return res.status(403).json({ message: 'Advertiser KYC not verified' });
  }
  next();
}

module.exports = {
  authMiddleware,
  authorizeRoles,
  requireKyc
};