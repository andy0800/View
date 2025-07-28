// backend/src/server.js
require('dotenv').config()
const express       = require('express')
const helmet        = require('helmet')
const cors          = require('cors')
const morgan        = require('morgan')
const Redis         = require('ioredis')
const path          = require('path')
const jwt           = require('jsonwebtoken')
const cookieParser  = require('cookie-parser')
const { sequelize } = require('./models')

// route imports
const authRoutes        = require('./routes/auth')
const adRoutes          = require('./routes/ads')
const videoRoutes       = require('./routes/videos')
const walletRoutes      = require('./routes/wallet')
const paymentRoutes     = require('./routes/payment')
const adminRoutes       = require('./routes/admin')
const advertiserRoutes  = require('./routes/advertiser')
const sectionRoutes     = require('./routes/sections')       // ← NEW
const { handleWebhook } = require('./controllers/paymentController')
const { authMiddleware, authorizeRoles } = require('./middleware/auth')

const app   = express()
const redis = new Redis(process.env.REDIS_URL)
const FRONT = process.env.FRONTEND_URL.trim()
const NODE_ENV = process.env.NODE_ENV || 'development'
const FRONT_BUILD =
  process.env.FRONTEND_BUILD_PATH?.trim() ||
  path.resolve(__dirname, '../frontend/dist')

// 1) Security headers
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }))

// 2) Serve uploaded files
const uploadDir = path.join(__dirname, 'uploads')
app.use(
  '/uploads',
  express.static(uploadDir, {
    setHeaders(res) {
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin')
    }
  })
)

// 3) Serve SPA build in prod
if (NODE_ENV === 'production') {
  app.use(express.static(FRONT_BUILD))
}

// 4) Cookies & CORS
app.use(cookieParser())
app.use(cors({ origin: FRONT, credentials: true, allowedHeaders: ['Content-Type','Authorization'] }))
app.options('*', cors())

// 5) Logging
app.use(morgan('dev'))

// 6) Stripe Webhook
app.post(
  '/api/payment/webhook',
  express.raw({ type: 'application/json' }),
  handleWebhook
)

// 7) Body parsers
app.use(express.json())
app.use(express.urlencoded({ extended: false }))

// 8) Attach Redis client
app.use((req, _, next) => { req.redis = redis; next() })

// 9) Public routes
app.use('/auth',        authRoutes)
app.use('/api/ad',      adRoutes)
app.use('/api/videos',  videoRoutes)
app.use('/api/wallet',  walletRoutes)
app.use('/api/payment', paymentRoutes)
app.use('/api/sections', sectionRoutes)                     // ← MOUNTED HERE

// 10) Advertiser (JWT + role)
app.use(
  '/advertiser',
  authMiddleware,
  authorizeRoles('advertiser'),
  advertiserRoutes
)

// 11) Admin inline auth + routes
function adminAuth(req, res, next) {
  let token = req.cookies.token || req.headers.authorization?.replace(/^Bearer\s*/i,'')
  if (!token) return res.status(401).json({ message: 'Auth token missing' })
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET.trim())
    next()
  } catch {
    res.clearCookie('token', { path: '/' })
    res.status(401).json({ message: 'Invalid or expired token' })
  }
}
app.use('/api/admin', adminAuth, adminRoutes)

// 12) Health check
app.get('/health', (_, res) => res.send('OK'))

// 13) SPA fallback for client routing
if (NODE_ENV === 'production') {
  app.get('*', (_, res) => res.sendFile(path.join(FRONT_BUILD, 'index.html')))
}

// 14) Global error handler
app.use((err, req, res, next) => {
  console.error(err)
  res.status(err.status || 500).json({ message: err.message || 'Server error' })
})

// 15) Start server & sync DB
;(async () => {
  await sequelize.sync({ alter: true })
  const PORT = process.env.PORT || 4001
  app.listen(PORT, () => console.log(`🚀 Backend listening on ${PORT}`))
})()