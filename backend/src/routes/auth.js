const express        = require('express');
const multer         = require('multer');
const path           = require('path');
const authController = require('../controllers/authController');

const upload = multer({
  dest: path.join(__dirname, '../uploads')
});

const router = express.Router();

// 1) OTP login
router.post('/request-otp', authController.requestOtp);
router.post('/verify-otp',  authController.verifyOtp);

// 2) Viewer sign-up (civil_front + civil_back)
router.post(
  '/register-viewer',
  upload.fields([
    { name: 'civil_front', maxCount: 1 },
    { name: 'civil_back',  maxCount: 1 }
  ]),
  authController.registerViewer
);

// 3) Advertiser sign-up (license_doc)
router.post(
  '/register-advertiser',
  upload.single('license_doc'),
  authController.registerAdvertiser
);

// 4) Admin login & logout
router.post('/admin-login', authController.adminLogin);
router.post('/logout',      authController.logout);

module.exports = router;