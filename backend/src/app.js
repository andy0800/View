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

// ✅ Serve frontend static files (in production)
if (NODE_ENV === 'production') {
  app.use(express.static(FRONT_BUILD));
}

// ✅ CORS + cookies
app.use(cookieParser());
app.use(cors({
  origin: [FRONT, 'http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
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

if (NODE_ENV === 'production') {
  app.get('*', (_, res) => res.sendFile(path.join(FRONT_BUILD, 'index.html')));
}

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
    
    if (NODE_ENV === 'development') {
      await sequelize.sync(); // ⚠️ Sync only in dev
      console.log('✅ Database synced successfully.');
    } else {
      // In production, create tables manually using raw SQL
      console.log('🔄 Initializing production database with raw SQL...');
      try {
        // Create tables using raw SQL to avoid model sync issues
        console.log('🔄 Creating core tables...');
        
        // Create users table
        await sequelize.query(`
          CREATE TABLE IF NOT EXISTS users (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name VARCHAR(255) NOT NULL,
            phone VARCHAR(255) UNIQUE NOT NULL,
            role VARCHAR(255) CHECK (role IN ('viewer', 'advertiser', 'admin')) DEFAULT 'viewer',
            kyc_status VARCHAR(255) CHECK (kyc_status IN ('pending', 'verified', 'rejected')) DEFAULT 'pending',
            company_name VARCHAR(255),
            license_number VARCHAR(255),
            signatory_name VARCHAR(255),
            license_doc_key VARCHAR(255),
            verified_at TIMESTAMPTZ,
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
          );
        `);
        
        // Create videos table
        await sequelize.query(`
          CREATE TABLE IF NOT EXISTS videos (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            url VARCHAR(255) NOT NULL,
            sections TEXT[],
            views INTEGER DEFAULT 0,
            spent DECIMAL(10, 2) DEFAULT 0,
            budget DECIMAL(10, 2) DEFAULT 0,
            duration INTEGER DEFAULT 30,
            is_active BOOLEAN DEFAULT true,
            advertiser_id UUID REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
          );
        `);
        
        // Create view_events table
        await sequelize.query(`
          CREATE TABLE IF NOT EXISTS view_events (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            video_id UUID NOT NULL REFERENCES videos(id) ON UPDATE CASCADE ON DELETE NO ACTION,
            user_id UUID REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL,
            viewed_at TIMESTAMPTZ DEFAULT NOW(),
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
          );
        `);
        
        // Create wallets table
        await sequelize.query(`
          CREATE TABLE IF NOT EXISTS wallets (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE,
            balance DECIMAL(20, 3) DEFAULT 0,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
          );
        `);
        
        // Create sections table
        await sequelize.query(`
          CREATE TABLE IF NOT EXISTS sections (
            id SERIAL PRIMARY KEY,
            key VARCHAR(255) UNIQUE NOT NULL,
            name VARCHAR(255) NOT NULL,
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
          );
        `);
        
        // Create advertiser_packages table
        await sequelize.query(`
          CREATE TABLE IF NOT EXISTS advertiser_packages (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            price DECIMAL(10, 2) NOT NULL,
            views INTEGER NOT NULL,
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
          );
        `);
        
        console.log('✅ Core tables created successfully.');
        console.log('✅ Production database initialized with raw SQL.');
      } catch (sqlError) {
        console.error('❌ Raw SQL table creation failed:', sqlError.message);
        console.error('❌ Full error:', sqlError);
        console.log('🔄 Attempting to continue without database initialization...');
        // Don't throw error, just continue
      }
    }
  } catch (error) {
    console.warn('⚠️ Database connection failed:', error.message);
    console.warn('⚠️ Server will start without database connection.');
  }

  const PORT = process.env.PORT || 4001;
  app.listen(PORT, () => console.log(`🚀 Backend listening on ${PORT}`));
})();