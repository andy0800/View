// backend/src/controllers/authController.js
const jwt = require('jsonwebtoken');
const { User, Wallet, Session } = require('../models');
const SessionService = require('../services/sessionService');
const { validateKuwaitPhone, validateCivilId } = require('../middleware/authMiddleware');

// ─────────────────────────────────────────────
// Test OTP fallback helper (when Redis is unavailable)
// ─────────────────────────────────────────────
function acceptTestOtp(phone, otp) {
  const viewerOtp = process.env.TEST_VIEWER_OTP;
  const advertiserOtp = process.env.TEST_ADVERTISER_OTP;
  if (!otp) return false;
  if ((viewerOtp && otp === viewerOtp) || (advertiserOtp && otp === advertiserOtp)) return true;
  // Development fallback: accept '0000' or '1234' if not in production
  if ((process.env.NODE_ENV || 'development') !== 'production') {
    if (otp === '0000' || otp === '1234') return true;
  }
  return false;
}

// ─────────────────────────────────────────────
// 1. Request OTP
// ─────────────────────────────────────────────
exports.requestOtp = async (req, res, next) => {
  try {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ message: 'Phone is required' });

    // Validate Kuwait phone format
    if (!validateKuwaitPhone(phone)) {
      return res.status(400).json({ 
        message: 'Invalid phone number. Must be Kuwait format: +965XXXXXXXX' 
      });
    }

    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    try {
      if (req.redis && req.redis.status === 'ready') {
        await req.redis.setex(`otp:${phone}`, 300, otp);
      } else {
        console.warn('⚠️ Redis not ready; skipping OTP store and relying on fallback.');
      }
    } catch (e) {
      console.warn('⚠️ Redis unavailable for OTP; relying on fallback.');
    }

    console.log(`OTP for ${phone}:`, otp);
    res.json({ success: true, message: 'OTP sent to phone' });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────
// 2. Verify OTP & Auto-Detect Role
// ─────────────────────────────────────────────
exports.verifyOtp = async (req, res, next) => {
  try {
    const { phone, otp } = req.body;
    if (!phone || !otp)
      return res.status(400).json({ message: 'Phone and OTP are required' });

    let saved = null;
    try {
      if (req.redis && req.redis.status === 'ready') {
        saved = await req.redis.get(`otp:${phone}`);
      }
    } catch (e) {
      console.warn('⚠️ Redis unavailable on verify; checking test OTP fallback.');
    }
    if (saved !== otp && !acceptTestOtp(phone, otp))
      return res.status(401).json({ message: 'Invalid or expired OTP' });

    try { if (req.redis && req.redis.status === 'ready') { await req.redis.del(`otp:${phone}`); } } catch {}

    // Find user by phone
    const user = await User.findOne({ where: { phone } });

    if (!user) {
      // User doesn't exist - this means they need to register first
      return res.status(404).json({ 
        message: 'User not registered. Please complete registration first.',
        requiresRegistration: true
      });
    }

    // Create wallet if doesn't exist
    await Wallet.findOrCreate({
      where: { user_id: user.id },
      defaults: {
        balance: 0.00
      }
    });

    // Get client IP and user agent
    const clientIP = SessionService.getClientIP(req);
    const userAgent = SessionService.getUserAgent(req);

    // Create session with IP tracking
    const sessionData = await SessionService.createSession(
      user.id,
      clientIP,
      userAgent,
      '30d' // 30 days session
    );

    // Set cookie with session token
    res.cookie('token', sessionData.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    });

    res.status(200).json({
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        role: user.role,
        kyc_status: user.kyc_status
      },
      sessionId: sessionData.sessionId,
      token: sessionData.token // Include JWT token for testing purposes
    });
  } catch (err) {
    console.error('verifyOtp error:', err);
    res.status(500).json({ message: 'Login failed' });
  }
};

// ─────────────────────────────────────────────
// 3. Register Viewer
// ─────────────────────────────────────────────
exports.registerViewer = async (req, res, next) => {
  try {
    const { name, civil_id, phone } = req.body;
    const files = req.files || {};

    // Validation
    if (!name || !civil_id || !phone) {
      return res.status(400).json({ 
        message: 'Name, Civil ID, and Phone are required' 
      });
    }

    if (!validateKuwaitPhone(phone)) {
      return res.status(400).json({ 
        message: 'Invalid phone number. Must be Kuwait format: +965XXXXXXXX' 
      });
    }

    if (!validateCivilId(civil_id)) {
      return res.status(400).json({ 
        message: 'Invalid Civil ID. Must be 12 digits' 
      });
    }

    if (!files.civil_front?.length || !files.civil_back?.length) {
      return res.status(400).json({ 
        message: 'Front and back Civil ID images are required' 
      });
    }

    // Check for existing user
    const existingUser = await User.findOne({
      where: {
        [require('sequelize').Op.or]: [
          { phone },
          { civil_id }
        ]
      }
    });

    if (existingUser) {
      if (existingUser.phone === phone) {
        return res.status(400).json({ message: 'Phone already registered' });
      }
      if (existingUser.civil_id === civil_id) {
        return res.status(400).json({ message: 'Civil ID already registered' });
      }
    }

    // Create user
    const user = await User.create({
      name,
      civil_id,
      phone,
      role: 'viewer',
      kyc_status: 'pending',
      civil_front_key: files.civil_front[0].filename,
      civil_back_key: files.civil_back[0].filename
    });

    // Create wallet
    await Wallet.create({
      user_id: user.id,
      balance: 0.00
    });

    // Auto-verify viewer (OTP verification is sufficient)
    await user.update({
      kyc_status: 'verified',
      verified_at: new Date()
    });

    res.status(201).json({
      message: 'Viewer registered successfully',
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        role: user.role,
        kyc_status: user.kyc_status
      }
    });
  } catch (err) {
    console.error('registerViewer error:', err);
    res.status(500).json({ message: 'Registration failed' });
  }
};

// ─────────────────────────────────────────────
// 4. Register Advertiser
// ─────────────────────────────────────────────
exports.registerAdvertiser = async (req, res, next) => {
  try {
    const { 
      name, 
      phone, 
      company_name, 
      license_number, 
      signatory_name 
    } = req.body;
    const files = req.files || {};

    // Validation
    if (!name || !phone || !company_name || !license_number || !signatory_name) {
      return res.status(400).json({ 
        message: 'All fields are required' 
      });
    }

    if (!validateKuwaitPhone(phone)) {
      return res.status(400).json({ 
        message: 'Invalid phone number. Must be Kuwait format: +965XXXXXXXX' 
      });
    }

    if (!files.license_doc?.length) {
      return res.status(400).json({ 
        message: 'Commercial License document is required' 
      });
    }

    // Check for existing user
    const existingUser = await User.findOne({
      where: { phone }
    });

    if (existingUser) {
      return res.status(400).json({ message: 'Phone already registered' });
    }

    // Create user
    const user = await User.create({
      name,
      phone,
      role: 'advertiser',
      kyc_status: 'pending',
      company_name,
      license_number,
      signatory_name,
      license_doc_key: files.license_doc[0].filename
    });

    // Create wallet
    await Wallet.create({
      user_id: user.id,
      balance: 0.00
    });

    res.status(201).json({
      message: 'Advertiser registered successfully. KYC verification pending.',
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        role: user.role,
        kyc_status: user.kyc_status,
        company_name: user.company_name
      }
    });
  } catch (err) {
    console.error('registerAdvertiser error:', err);
    res.status(500).json({ message: 'Registration failed' });
  }
};

// ─────────────────────────────────────────────
// 4. Generic Registration (handles both user types)
// ─────────────────────────────────────────────
exports.register = async (req, res, next) => {
  try {
    const { phone, fullName, civilId, userType } = req.body;
    
    // Validate required fields
    if (!phone || !fullName || !userType) {
      return res.status(400).json({ 
        message: 'Phone, full name, and user type are required' 
      });
    }
    
    // Civil ID is only required for viewers
    if (userType === 'viewer' && !civilId) {
      return res.status(400).json({ 
        message: 'Civil ID is required for viewers' 
      });
    }

    // Validate phone format
    if (!validateKuwaitPhone(phone)) {
      return res.status(400).json({ 
        message: 'Invalid phone number. Must be Kuwait format: +965XXXXXXXX' 
      });
    }

    // Validate user type
    if (!['viewer', 'advertiser'].includes(userType)) {
      return res.status(400).json({ 
        message: 'Invalid user type. Must be "viewer" or "advertiser"' 
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ where: { phone } });
    if (existingUser) {
      return res.status(400).json({ 
        message: 'User with this phone number already exists' 
      });
    }

    // Validate Civil ID uploads (only required for viewers)
    if (userType === 'viewer') {
      if (!req.files.civilIdFront || !req.files.civilIdBack) {
        return res.status(400).json({ 
          message: 'Civil ID front and back photos are required for viewers' 
        });
      }
    }

    // Validate advertiser-specific requirements
    if (userType === 'advertiser') {
      const { companyName, licenseNumber, signatoryName } = req.body;
      
      if (!companyName || !licenseNumber || !signatoryName) {
        return res.status(400).json({ 
          message: 'Company name, license number, and signatory name are required for advertisers' 
        });
      }

      if (!req.files.licenseDocument) {
        return res.status(400).json({ 
          message: 'License document is required for advertisers' 
        });
      }
    }

    // Create user
    const userData = {
      name: fullName,
      phone,
      civil_id: userType === 'viewer' ? civilId : null, // Only set civil_id for viewers
      role: userType,
      kyc_status: 'pending',
      is_active: true
    };

    // Add advertiser-specific fields
    if (userType === 'advertiser') {
      userData.company_name = req.body.companyName;
      userData.license_number = req.body.licenseNumber;
      userData.signatory_name = req.body.signatoryName;
      userData.license_doc_key = req.files.licenseDocument[0].filename;
    }

    const user = await User.create(userData);

    // Create wallet
    await Wallet.create({
      user_id: user.id,
      balance: 0.00
    });

    // Handle file uploads for viewers only
    if (userType === 'viewer') {
      const civilFrontKey = req.files.civilIdFront[0].filename;
      const civilBackKey = req.files.civilIdBack[0].filename;

      // Update user with file keys
      await user.update({
        civil_front_key: civilFrontKey,
        civil_back_key: civilBackKey
      });
    }

    res.status(201).json({
      success: true,
      message: 'Registration successful! Please verify your phone number.',
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        role: user.role,
        kyc_status: user.kyc_status
      }
    });

  } catch (err) {
    console.error('❌ Registration error:', err);
    next(err);
  }
};

// ─────────────────────────────────────────────
// 5. Logout
// ─────────────────────────────────────────────
exports.logout = async (req, res, next) => {
  try {
    const token = req.cookies?.token || req.headers.authorization?.replace(/^Bearer\s*/i, '');
    
    if (token) {
      // Find and invalidate the session
      const session = await Session.findOne({
        where: { token, is_active: true }
      });
      
      if (session) {
        await SessionService.invalidateSession(session.id);
        console.log(`✅ Session invalidated for logout: ${session.id}`);
      }
    }

    res.clearCookie('token', { path: '/' });
    res.json({ message: 'Logged out successfully' });
  } catch (err) {
    console.error('❌ Logout error:', err);
    next(err);
  }
};

// ─────────────────────────────────────────────
// 6. Get Current User / Session Check
// ─────────────────────────────────────────────
exports.getCurrentUser = async (req, res, next) => {
  try {
    // Check if user is authenticated
    if (!req.user) {
      return res.status(401).json({ message: 'No session' });
    }

    // Handle admin user
    if (req.user.role === 'admin') {
      return res.json({
        user: { 
          id: 0, 
          role: 'admin', 
          kyc_status: 'verified' 
        }
      });
    }

    const user = await User.findByPk(req.user.id, {
      include: [
        {
          model: Wallet,
          as: 'wallet',
          attributes: ['balance']
        }
      ]
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        role: user.role,
        kyc_status: user.kyc_status,
        company_name: user.company_name,
        wallet: user.wallet
      }
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────
// 7. Get User Sessions (for session management)
// ─────────────────────────────────────────────
exports.getUserSessions = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const sessions = await SessionService.getUserSessions(req.user.id);
    
    res.json({
      sessions: sessions.map(session => ({
        id: session.id,
        ip_address: session.ip_address,
        user_agent: session.user_agent,
        created_at: session.created_at,
        last_activity: session.last_activity,
        expires_at: session.expires_at
      }))
    });
  } catch (err) {
    console.error('❌ Get user sessions error:', err);
    next(err);
  }
};

// ─────────────────────────────────────────────
// 8. Invalidate Session (for session management)
// ─────────────────────────────────────────────
exports.invalidateSession = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { sessionId } = req.params;
    
    if (!sessionId) {
      return res.status(400).json({ message: 'Session ID is required' });
    }

    const success = await SessionService.invalidateSession(sessionId);
    
    if (success) {
      res.json({ message: 'Session invalidated successfully' });
    } else {
      res.status(400).json({ message: 'Failed to invalidate session' });
    }
  } catch (err) {
    console.error('❌ Invalidate session error:', err);
    next(err);
  }
};