// backend/src/middleware/kycMiddleware.js

async function requireKyc(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  if (!req.user.isKycVerified) {
    return res.status(403).json({ message: 'KYC verification required' });
  }
  next();
}

module.exports = { requireKyc };