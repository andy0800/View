require('dotenv').config();
// Build timestamp: 2025-01-09T11:30:00.000Z - Force cache invalidation
console.log('🚀 STARTING FRESH APP.JS - CACHE INVALIDATED - 2025-01-09T11:30:00.000Z');
const express       = require('express');
const helmet        = require('helmet');
const cors          = require('cors');
const morgan        = require('morgan');
const Redis         = require('ioredis');
const path          = require('path');
const jwt           = require('jsonwebtoken');
const cookieParser  = require('cookie-parser');
const { sequelize } = require('./models');

// Import startup database fix
const { fixDatabaseOnStartup } = require('./startup/databaseFix');
const { quickDatabaseFix } = require('./startup/quickDatabaseFix');
const { completeDatabaseRebuild } = require('./startup/completeDatabaseRebuild');

// Middleware
const { handleWebhook } = require('./controllers/paymentController');
const { authenticate, authorizeRoles, requireKyc } = require('./middleware/authMiddleware');

// ✅ Routes
const { router: authRoutes } = require('./routes/auth');
const adRoutes          = require('./routes/ads');
const videoRoutes       = require('./routes/videos');
const walletRoutes      = require('./routes/wallet');
const paymentRoutes     = require('./routes/payment');
const sectionRoutes     = require('./routes/sections');
const advertiserRoutes  = require('./routes/advertiser');
const adminRoutes       = require('./routes/admin');
const viewerRoutes      = require('./routes/viewerRoutes');
const companyRoutes     = require('./routes/company');
const commentRoutes     = require('./routes/comments');

const app   = express();
const redis = new Redis(process.env.REDIS_URL);
const FRONT = process.env.FRONTEND_URL?.trim() || 'http://localhost:5173';
const NODE_ENV = process.env.NODE_ENV || 'development';
const FRONT_BUILD = process.env.FRONTEND_BUILD_PATH?.trim() || path.resolve(__dirname, '../frontend/dist');

// ✅ Security headers
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

// ✅ Static uploads - serve from the uploads directory in the backend src folder
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  setHeaders(res, path) {
    // CORS headers to allow cross-origin access
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Range, Accept-Ranges, Content-Range, Content-Length');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.setHeader('Cross-Origin-Embedder-Policy', 'unsafe-none');
    
    // Set proper MIME types for video files
    if (path.endsWith('.mp4')) {
      res.setHeader('Content-Type', 'video/mp4');
      res.setHeader('Accept-Ranges', 'bytes');
    } else if (path.endsWith('.webm')) {
      res.setHeader('Content-Type', 'video/webm');
      res.setHeader('Accept-Ranges', 'bytes');
    } else if (path.endsWith('.ogg')) {
      res.setHeader('Content-Type', 'video/ogg');
      res.setHeader('Accept-Ranges', 'bytes');
    }
  }
}));

// ✅ Handle OPTIONS requests for CORS preflight
app.options('/uploads/*', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Range, Accept-Ranges, Content-Range, Content-Length');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  res.setHeader('Cross-Origin-Embedder-Policy', 'unsafe-none');
  res.status(200).end();
});

// ✅ Frontend is deployed separately on Render - no static file serving needed

// ✅ CORS + cookies
app.use(cookieParser());
app.use(cors({
  origin: [FRONT, 'https://viewapp-frontend.onrender.com', 'http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 200
}));
app.options('*', cors());

// ✅ Logging and body parsing
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// ✅ Stripe webhook (raw body)
app.post('/api/payment/webhook', express.raw({ type: 'application/json' }), handleWebhook);

// ✅ Inject Redis
app.use((req, _, next) => {
  req.redis = redis;
  next();
});

// ─────────────────────────
// ✅ HEALTH CHECK
// ─────────────────────────
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// ─────────────────────────
// ✅ PUBLIC ROUTES
// ─────────────────────────
app.use('/auth',        authRoutes);
app.use('/api/ad',      adRoutes);
app.use('/api/videos',  videoRoutes);
app.use('/api/wallet',  walletRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/sections', sectionRoutes);
app.use('/api/company', companyRoutes);
app.use('/api/comments', commentRoutes);

// ─────────────────────────
// ✅ PROTECTED ROUTES
// ─────────────────────────

// Viewer - Updated to use /api/viewer for consistency
app.use(
  '/api/viewer',
  authenticate,
  authorizeRoles('viewer'),
  viewerRoutes
);

// Advertiser - Updated to use /api/advertiser for consistency
app.use(
  '/api/advertiser',
  authenticate,
  authorizeRoles('advertiser'),
  advertiserRoutes
);

// Admin
app.use(
  '/api/admin',
  authenticate,
  authorizeRoles('admin'),
  adminRoutes
);

// ─────────────────────────
// ✅ UTILITY
// ─────────────────────────

app.get('/health', (_, res) => res.send('OK'));

// ✅ Frontend is deployed separately - no catch-all route needed

// Global error handler
const errorHandler = require('./middleware/errorHandler');
app.use(errorHandler);

// ─────────────────────────
// ✅ BOOT SERVER
// ─────────────────────────
(async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');
    
    // CRITICAL: Database initialization with rebuild option
    console.log('⚡ RUNNING DATABASE INITIALIZATION...');
    try {
      // Check if we should do a complete rebuild
      const shouldRebuild = process.env.FORCE_DATABASE_REBUILD === 'true' || 
                           process.env.NODE_ENV === 'development';
      
      if (shouldRebuild) {
        console.log('🚀 FORCE REBUILD ENABLED - Running complete database rebuild...');
        await completeDatabaseRebuild();
        console.log('✅ Complete database rebuild completed successfully');
      } else {
        // Run quick database fix
        console.log('🔧 Running quick database fix...');
        const quickFixSuccess = await quickDatabaseFix();
        if (quickFixSuccess) {
          console.log('✅ Quick database fix completed successfully');
        } else {
          console.log('⚠️ Quick database fix completed with warnings');
        }
      }
    } catch (error) {
      console.error('❌ Database initialization failed:', error.message);
      console.log('⚠️ Continuing app startup despite database initialization failure');
    }
    
    if (NODE_ENV === 'development') {
      await sequelize.sync(); // ⚠️ Sync only in dev
      console.log('✅ Database synced successfully.');
    } else {
      // In production, use smart initialization utility
      console.log('🔄 Initializing production database...');
      const { initializeDatabase } = require('./utils/dbInit');
      const success = await initializeDatabase(sequelize);
      
      if (success) {
        console.log('✅ Production database initialized successfully.');
      } else {
        console.log('⚠️ Database initialization failed, but continuing...');
      }
    }
  } catch (error) {
    console.warn('⚠️ Database connection failed:', error.message);
    console.warn('⚠️ Server will start without database connection.');
  }

  const PORT = process.env.PORT || 4001;
  app.listen(PORT, () => console.log(`🚀 Backend listening on ${PORT}`));
})();