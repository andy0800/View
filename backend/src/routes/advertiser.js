// backend/src/routes/advertiser.js
const express = require('express')
const multer  = require('multer')
const path    = require('path')
const { authMiddleware, authorizeRoles } = require('../middleware/auth')
const ctrl    = require('../controllers/advertiserController')

const upload = multer({ dest: path.join(__dirname, '../uploads') })
const router = express.Router()

router.use(authMiddleware, authorizeRoles('advertiser'))

router.get('/ads',          ctrl.getAds)
router.post(
  '/ads',
  upload.single('media'),
  express.json(),         // ensure JSON parsing of body fields
  ctrl.createAd
)

router.get('/credit',       ctrl.getCredit)
router.post('/credit/deposit',  ctrl.depositCredit)
router.post('/credit/withdraw', ctrl.withdrawCredit)
router.post('/packages/buy',     ctrl.buyPackage)

router.get('/profile',      ctrl.getProfile)
router.put(
  '/profile',
  upload.single('license_doc'),
  ctrl.updateProfile
)

module.exports = router