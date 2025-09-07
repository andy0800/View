// backend/src/middleware/errorHandler.js
// Global error handler middleware to prevent 500 errors

const errorHandler = (err, req, res, next) => {
  console.error('🚨 Global error handler caught:', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    user: req.user?.id || 'unauthenticated'
  });

  // Handle Sequelize errors
  if (err.name === 'SequelizeValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      error: 'VALIDATION_ERROR',
      details: err.errors?.map(e => ({
        field: e.path,
        message: e.message
      }))
    });
  }

  if (err.name === 'SequelizeDatabaseError') {
    console.error('❌ Database error:', err);
    return res.status(503).json({
      success: false,
      message: 'Service temporarily unavailable',
      error: 'SERVICE_UNAVAILABLE'
    });
  }

  if (err.name === 'SequelizeConnectionError') {
    console.error('❌ Database connection error:', err);
    return res.status(503).json({
      success: false,
      message: 'Service temporarily unavailable',
      error: 'SERVICE_UNAVAILABLE'
    });
  }

  if (err.name === 'SequelizeUniqueConstraintError') {
    return res.status(409).json({
      success: false,
      message: 'Resource already exists',
      error: 'DUPLICATE_RESOURCE'
    });
  }

  // Handle JWT errors
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
      message: 'Authentication token expired',
      error: 'TOKEN_EXPIRED'
    });
  }

  // Handle authentication errors
  if (err.status === 401) {
    return res.status(401).json({
      success: false,
      message: err.message || 'Authentication required',
      error: 'AUTH_REQUIRED'
    });
  }

  // Handle authorization errors
  if (err.status === 403) {
    return res.status(403).json({
      success: false,
      message: err.message || 'Access denied',
      error: 'ACCESS_DENIED'
    });
  }

  // Handle not found errors
  if (err.status === 404) {
    return res.status(404).json({
      success: false,
      message: err.message || 'Resource not found',
      error: 'NOT_FOUND'
    });
  }

  // Handle rate limiting errors
  if (err.status === 429) {
    return res.status(429).json({
      success: false,
      message: 'Too many requests',
      error: 'RATE_LIMITED'
    });
  }

  // Handle any other unexpected errors
  console.error('🚨 Unhandled error type:', err.name);
  res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message,
    error: 'INTERNAL_ERROR',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

module.exports = errorHandler;
