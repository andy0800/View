#!/usr/bin/env node

/**
 * VIEW APP - Environment Setup Script
 * 
 * This script helps you set up environment files for both frontend and backend
 * Run with: node setup-env.js
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function setupEnvironment() {
  console.log('🚀 VIEW APP - Environment Setup');
  console.log('================================\n');

  // Frontend Environment Setup
  console.log('📱 Setting up Frontend Environment...');
  const frontendEnv = await createFrontendEnv();
  fs.writeFileSync('frontend/.env', frontendEnv);
  console.log('✅ Frontend .env created\n');

  // Backend Environment Setup
  console.log('🔧 Setting up Backend Environment...');
  const backendEnv = await createBackendEnv();
  fs.writeFileSync('backend/.env', backendEnv);
  console.log('✅ Backend .env created\n');

  console.log('🎉 Environment setup complete!');
  console.log('\n📋 Next steps:');
  console.log('1. Update the placeholder values in both .env files');
  console.log('2. Add your real AWS credentials, database URLs, and API keys');
  console.log('3. Test your application with the new environment variables');
  console.log('\n⚠️  Remember: Never commit .env files to version control!');

  rl.close();
}

async function createFrontendEnv() {
  const appName = await question('App name (default: ViewApp): ') || 'ViewApp';
  const apiUrl = await question('API Base URL (default: https://your-eb-domain.elasticbeanstalk.com/api): ') || 'https://your-eb-domain.elasticbeanstalk.com/api';
  const stripeKey = await question('Stripe Publishable Key (default: pk_test_CHANGEME): ') || 'pk_test_CHANGEME';

  return `# ===========================================
# VIEW APP - Frontend Environment Variables
# ===========================================
# Only public/non-sensitive values with VITE_ prefix
# These are exposed to the browser, so NO SECRETS!

# ===========================================
# APP CONFIGURATION
# ===========================================
VITE_APP_NAME=${appName}
VITE_APP_VERSION=1.0.0
VITE_NODE_ENV=production
VITE_APP_DESCRIPTION=Ad Rewards Platform for Kuwait Market

# ===========================================
# API CONFIGURATION
# ===========================================
VITE_API_BASE_URL=${apiUrl}
VITE_API_TIMEOUT=30000

# ===========================================
# SOCKET.IO CONFIGURATION
# ===========================================
VITE_SOCKET_URL=${apiUrl.replace('/api', '')}

# ===========================================
# STRIPE CONFIGURATION (Public Keys Only)
# ===========================================
VITE_STRIPE_PUBLISHABLE_KEY=${stripeKey}

# ===========================================
# INTERNATIONALIZATION
# ===========================================
VITE_DEFAULT_LANGUAGE=en
VITE_SUPPORTED_LANGUAGES=en,ar
VITE_RTL_LANGUAGES=ar

# ===========================================
# PWA CONFIGURATION
# ===========================================
VITE_PWA_NAME=View App
VITE_PWA_SHORT_NAME=View
VITE_PWA_THEME_COLOR=#1976d2
VITE_PWA_BACKGROUND_COLOR=#ffffff

# ===========================================
# FEATURE FLAGS
# ===========================================
VITE_ENABLE_ANALYTICS=false
VITE_ENABLE_DEBUG_MODE=false
VITE_ENABLE_OFFLINE_MODE=true

# ===========================================
# CURRENCY CONFIGURATION
# ===========================================
VITE_DEFAULT_CURRENCY=KWD
VITE_CURRENCY_SYMBOL=د.ك
VITE_CURRENCY_DECIMAL_PLACES=3

# ===========================================
# VIDEO CONFIGURATION
# ===========================================
VITE_VIDEO_AUTOPLAY=false
VITE_VIDEO_MUTED=true
VITE_VIDEO_LOOP=false
VITE_MAX_VIDEO_DURATION=300

# ===========================================
# UPLOAD CONFIGURATION
# ===========================================
VITE_MAX_FILE_SIZE=104857600
VITE_ALLOWED_FILE_TYPES=mp4,avi,mov,wmv,flv,webm

# ===========================================
# NOTIFICATION CONFIGURATION
# ===========================================
VITE_ENABLE_PUSH_NOTIFICATIONS=true
VITE_ENABLE_EMAIL_NOTIFICATIONS=true

# ===========================================
# SECURITY CONFIGURATION
# ===========================================
VITE_SESSION_TIMEOUT=3600000
VITE_MAX_LOGIN_ATTEMPTS=5
VITE_LOCKOUT_DURATION=900000`;
}

async function createBackendEnv() {
  const port = await question('Server Port (default: 8080): ') || '8080';
  const allowedOrigin = await question('Allowed Origin (default: https://yourdomain.com): ') || 'https://yourdomain.com';
  const dbHost = await question('Database Host (default: dpg-d2vdj7ogjchc73b4iqig-a): ') || 'dpg-d2vdj7ogjchc73b4iqig-a';
  const dbPassword = await question('Database Password (default: Hj82NSRMhqsi2GgTzoG0Wmzs8Se21GAf): ') || 'Hj82NSRMhqsi2GgTzoG0Wmzs8Se21GAf';
  const jwtSecret = await question('JWT Secret (default: 2d8ea8f818adbb33b8d878efb2b13cad8b9c256eb6330773c201dfb36c2cfd0b): ') || '2d8ea8f818adbb33b8d878efb2b13cad8b9c256eb6330773c201dfb36c2cfd0b';
  const stripeSecret = await question('Stripe Secret Key (default: sk_test_CHANGEME): ') || 'sk_test_CHANGEME';
  const awsAccessKey = await question('AWS Access Key ID (default: CHANGEME_AWS_ACCESS_KEY): ') || 'CHANGEME_AWS_ACCESS_KEY';
  const awsSecretKey = await question('AWS Secret Access Key (default: CHANGEME_AWS_SECRET): ') || 'CHANGEME_AWS_SECRET';
  const s3Bucket = await question('S3 Bucket Name (default: your-s3-bucket-name): ') || 'your-s3-bucket-name';

  return `# ===========================================
# VIEW APP - Backend Environment Variables
# ===========================================
# Contains ALL sensitive credentials and secrets
# NEVER commit this file to version control!

# ===========================================
# SERVER CONFIGURATION
# ===========================================
PORT=${port}
NODE_ENV=production
ALLOWED_ORIGIN=${allowedOrigin}
FRONTEND_URL=${allowedOrigin}
FRONTEND_BUILD_PATH=../frontend/dist

# ===========================================
# DATABASE CONFIGURATION
# ===========================================
DB_HOST=dpg-d2vdj7ogjchc73b4iqig-a
DB_PORT=5432
DB_NAME=viewapp_postgres
DB_USER=viewapp_postgres_user
DB_PASS=Hj82NSRMhqsi2GgTzoG0Wmzs8Se21GAf
DB_URL=postgresql://viewapp_postgres_user:Hj82NSRMhqsi2GgTzoG0Wmzs8Se21GAf@dpg-d2vdj7ogjchc73b4iqig-a/viewapp_postgres

# ===========================================
# REDIS CONFIGURATION
# ===========================================
REDIS_URL=redis://red-d2vdrcmr433s73f4oaj0:6379
REDIS_PASSWORD=CHANGEME_REDIS_PASSWORD

# ===========================================
# JWT CONFIGURATION
# ===========================================
JWT_SECRET=2d8ea8f818adbb33b8d878efb2b13cad8b9c256eb6330773c201dfb36c2cfd0b
JWT_EXPIRES_IN=24h
JWT_REFRESH_SECRET=CHANGEME_JWT_REFRESH_SECRET_KEY_AT_LEAST_32_CHARACTERS_LONG
JWT_REFRESH_EXPIRES_IN=7d

# ===========================================
# STRIPE CONFIGURATION
# ===========================================
STRIPE_SECRET_KEY=${stripeSecret}
STRIPE_PUBLISHABLE_KEY=pk_test_CHANGEME_STRIPE_PUBLISHABLE_KEY
STRIPE_WEBHOOK_SECRET=whsec_CHANGEME_STRIPE_WEBHOOK_SECRET
STRIPE_CURRENCY=KWD

# ===========================================
# AWS CONFIGURATION
# ===========================================
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=${awsAccessKey}
AWS_SECRET_ACCESS_KEY=${awsSecretKey}
AWS_S3_BUCKET=${s3Bucket}
AWS_S3_REGION=us-east-1

# ===========================================
# AWS SES CONFIGURATION (Email Service)
# ===========================================
AWS_SES_REGION=us-east-1
AWS_SES_FROM_EMAIL=noreply@yourdomain.com
AWS_SES_FROM_NAME=View App

# ===========================================
# OTP CONFIGURATION
# ===========================================
OTP_SECRET=CHANGEME_OTP_SECRET_KEY_AT_LEAST_32_CHARACTERS_LONG
OTP_EXPIRES_IN=300000
OTP_LENGTH=6

# ===========================================
# SECURITY CONFIGURATION
# ===========================================
BCRYPT_ROUNDS=12
SESSION_SECRET=CHANGEME_SESSION_SECRET_KEY_AT_LEAST_32_CHARACTERS_LONG
CORS_ORIGIN=${allowedOrigin}
HELMET_CSP_ENABLED=true

# ===========================================
# RATE LIMITING
# ===========================================
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_SKIP_SUCCESSFUL_REQUESTS=false

# ===========================================
# FILE UPLOAD CONFIGURATION
# ===========================================
MAX_FILE_SIZE=104857600
UPLOAD_PATH=./src/uploads
ALLOWED_FILE_TYPES=mp4,avi,mov,wmv,flv,webm,jpg,jpeg,png,pdf

# ===========================================
# LOGGING CONFIGURATION
# ===========================================
LOG_LEVEL=info
LOG_FILE=./logs/app.log
LOG_MAX_SIZE=10m
LOG_MAX_FILES=5

# ===========================================
# MONITORING CONFIGURATION
# ===========================================
ENABLE_METRICS=true
METRICS_PORT=9090
HEALTH_CHECK_INTERVAL=30000

# ===========================================
# BUSINESS LOGIC CONFIGURATION
# ===========================================
DEFAULT_CREDIT_REWARD=10
MIN_WITHDRAWAL_AMOUNT=1000
MAX_WITHDRAWAL_AMOUNT=100000
COMPANY_FEE_PERCENTAGE=5
AD_VERIFICATION_REQUIRED=true
KYC_VERIFICATION_REQUIRED=true

# ===========================================
# NOTIFICATION CONFIGURATION
# ===========================================
ENABLE_EMAIL_NOTIFICATIONS=true
ENABLE_PUSH_NOTIFICATIONS=true
NOTIFICATION_RETRY_ATTEMPTS=3
NOTIFICATION_RETRY_DELAY=5000

# ===========================================
# CACHE CONFIGURATION
# ===========================================
CACHE_TTL=3600
CACHE_MAX_ITEMS=1000
CACHE_CLEANUP_INTERVAL=300000

# ===========================================
# DEVELOPMENT/DEBUG CONFIGURATION
# ===========================================
DEBUG_MODE=false
VERBOSE_LOGGING=false
ENABLE_SWAGGER=false
ENABLE_GRAPHQL_PLAYGROUND=false`;
}

// Run the setup
setupEnvironment().catch(console.error);
