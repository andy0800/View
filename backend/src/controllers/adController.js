// backend/src/controllers/adController.js
const { Ad, AdvertiserPackage, Wallet, Withdrawal } = require('../models');
const { uploadToS3 } = require('../utils/upload');

/**
 * GET /api/ad
 * List all ads for the advertiser
 */
async function getAds(req, res, next) {
  try {
    const ads = await Ad.findAll({
      where: { advertiserId: req.user.id },
      include: [{ model: AdvertiserPackage, as: 'package' }]
    });
    res.json(ads);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/ad/packages
 * List all available advertiser packages
 */
async function listPackages(req, res, next) {
  try {
    const pkgs = await AdvertiserPackage.findAll();
    res.json(pkgs);
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/ad/purchase
 * Deduct cost, credit wallet, record purchase
 */
async function purchasePackage(req, res, next) {
  try {
    const { packageId } = req.body;
    const pkg = await AdvertiserPackage.findByPk(packageId);
    if (!pkg) return res.status(404).json({ message: 'Package not found' });

    // Create or top-up wallet
    const [wallet] = await Wallet.findOrCreate({
      where: { userId: req.user.id }
    });
    wallet.balance = parseFloat(wallet.balance) + parseFloat(pkg.price);
    await wallet.save();

    res.json({ message: 'Package purchased', balance: wallet.balance });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/ad/upload
 * Upload ad media to S3 and record the Ad
 */
async function uploadAd(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    const imageKey = await uploadToS3(
      req.file.buffer,
      req.file.originalname,
      'ad-images'
    );
    const ad = await Ad.create({
      title: req.body.title,
      description: req.body.description,
      link: req.body.link,
      imageKey,
      advertiserId: req.user.id,
      packageId: req.body.packageId
    });
    res.status(201).json(ad);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/ad/credit
 * Return current wallet balance
 */
async function getCredit(req, res, next) {
  try {
    const wallet = await Wallet.findOne({ where: { userId: req.user.id } });
    res.json({ balance: wallet?.balance || 0 });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/ad/withdraw
 * Create a withdrawal request
 */
async function withdrawCredit(req, res, next) {
  try {
    const { amount } = req.body;
    const wallet = await Wallet.findOne({ where: { userId: req.user.id } });
    if (!wallet || parseFloat(wallet.balance) < parseFloat(amount)) {
      return res.status(400).json({ message: 'Insufficient funds' });
    }

    // Deduct immediately (or wait for admin approval)
    wallet.balance = parseFloat(wallet.balance) - parseFloat(amount);
    await wallet.save();

    // Record withdrawal request
    await Withdrawal.create({
      userId: req.user.id,
      amount,
      approved: null
    });

    res.json({ message: 'Withdrawal requested', balance: wallet.balance });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getAds,
  listPackages,
  purchasePackage,
  uploadAd,
  getCredit,
  withdrawCredit
};