// backend/src/controllers/authController.js

const jwt     = require('jsonwebtoken');
const { User } = require('../models');

/**
 * 1) Request OTP
 */
exports.requestOtp = async (req, res, next) => {
  try {
    const { phone } = req.body;
    if (!phone) {
      return res.status(400).json({ message: 'Phone number is required' });
    }

    // generate a 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // store in Redis for 5 minutes
    await req.redis.set(`otp:${phone}`, code, 'EX', 300);

    // TODO: integrate with actual SMS provider
    console.log(`📲 OTP for ${phone}: ${code}`);

    return res.json({ success: true, message: 'OTP sent' });
  } catch (err) {
    next(err);
  }
};

/**
 * 2) Verify OTP & Login (viewer or advertiser)
 */
exports.verifyOtp = async (req, res, next) => {
  try {
    const { phone, code } = req.body;
    if (!phone || !code) {
      return res.status(400).json({ message: 'Phone and OTP are required' });
    }

    const saved = await req.redis.get(`otp:${phone}`);
    if (saved !== code) {
      return res.status(401).json({ message: 'Invalid or expired OTP' });
    }

    // find or create user
    let user = await User.findOne({ where: { phone } });
    if (!user) {
      user = await User.create({
        name:       phone,
        phone,
        role:       'viewer',
        kyc_status: 'verified'
      });
    }

    // sign JWT and set HTTP-only cookie
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET.trim(),
      { expiresIn: '7d' }
    );
    res.cookie('token', token, {
      httpOnly: true,
      secure:   process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path:     '/',
      maxAge:   7 * 24 * 60 * 60 * 1000
    });

    return res.json({
      user: {
        id:    user.id,
        name:  user.name,
        phone: user.phone,
        role:  user.role
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * 3) Viewer registration (civil_front + civil_back)
 */
exports.registerViewer = async (req, res, next) => {
  try {
    const { name, civil_id, phone } = req.body;
    const files = req.files || {};

    if (!files.civil_front?.length || !files.civil_back?.length) {
      return res.status(400).json({ message: 'Front and back images are required' });
    }

    // prevent duplicate
    if (await User.findOne({ where: { phone } })) {
      return res.status(400).json({ message: 'Phone already registered' });
    }

    const frontPath = `/uploads/${files.civil_front[0].filename}`;
    const backPath  = `/uploads/${files.civil_back[0].filename}`;

    await User.create({
      name,
      civil_id,
      phone,
      role:        'viewer',
      kyc_status:  'verified',
      civil_front: frontPath,
      civil_back:  backPath
    });

    return res.json({ success: true, message: 'Viewer registered. You may now login.' });
  } catch (err) {
    next(err);
  }
};

/**
 * 4) Advertiser registration (license_doc)
 */
exports.registerAdvertiser = async (req, res, next) => {
  try {
    const {
      name,
      civil_id,
      phone,
      company_name,
      license_number,
      signatory_name
    } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: 'License document is required' });
    }

    const licensePath = `/uploads/${req.file.filename}`;

    // upgrade existing viewer or create new
    let user = await User.findOne({ where: { phone } });

    if (user) {
      if (user.role === 'advertiser') {
        return res.status(400).json({ message: 'Already registered as advertiser' });
      }
      // viewer → advertiser
      Object.assign(user, {
        name,
        civil_id,
        role:           'advertiser',
        company_name,
        license_number,
        signatory_name,
        license_doc:    licensePath,
        kyc_status:     'pending'
      });
      await user.save();

      return res.json({
        success: true,
        message: 'Upgraded to advertiser. Awaiting KYC approval.'
      });
    }

    // brand-new advertiser
    await User.create({
      name,
      civil_id,
      phone,
      role:           'advertiser',
      kyc_status:     'pending',
      company_name,
      license_number,
      signatory_name,
      license_doc:    licensePath
    });

    return res.json({ success: true, message: 'Advertiser registered. Awaiting KYC approval.' });
  } catch (err) {
    next(err);
  }
};

/**
 * 5) Admin login — sets HTTP-only cookie
 */
exports.adminLogin = async (req, res, next) => {
  try {
    const { username, password } = req.body;
    if (
      username !== process.env.ADMIN_USERNAME ||
      password !== process.env.ADMIN_PASSWORD
    ) {
      return res.status(401).json({ message: 'Invalid admin credentials' });
    }
    const token = jwt.sign(
      { id: 0, role: 'admin' },
      process.env.JWT_SECRET.trim(),
      { expiresIn: '7d' }
    );
    res.cookie('token', token, {
      httpOnly: true,
      secure:   process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path:     '/',
      maxAge:   7 * 24 * 60 * 60 * 1000
    });
    return res.json({ user: { id: 0, role: 'admin', kyc_status: 'verified' } });
  } catch (err) {
    next(err);
  }
};

/**
 * 6) Logout — clears the cookie
 */
exports.logout = (req, res) => {
  res.clearCookie('token', { path: '/' });
  return res.json({ success: true });
};