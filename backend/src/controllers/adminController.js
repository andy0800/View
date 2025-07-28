// backend/src/controllers/adminController.js

const {
  User,
  Withdrawal,
  Transaction,
  Video,
  AdvertiserPackage
} = require('../models');

//
// 1) GET /api/admin/users
//
exports.getUsers = async (req, res, next) => {
  try {
    const users = await User.findAll({
      attributes: ['id', 'name', 'phone', 'role', 'kyc_status', 'created_at'],
      order: [['created_at', 'DESC']]
    });
    res.json(users);
  } catch (err) {
    next(err);
  }
};

//
// 2) GET /api/admin/kyc
//    Fetch advertisers whose kyc_status is still 'pending'
//
exports.getKycRequests = async (req, res, next) => {
  try {
    const pending = await User.findAll({
    where: {
      role: 'advertiser',
      kyc_status: 'pending'
    },
    attributes: [
      'id',
      'name',
      'phone',
      'civil_id',
      'company_name',
      'license_number',
      'signatory_name',
      // 'license_doc' was removed because your DB has no such column
      'created_at'
    ],
    order: [['created_at','ASC']]
  });
    res.json(pending);
  } catch (err) {
    next(err);
  }
};

//
// 3) PATCH /api/admin/kyc/:id
//    Approve or reject an advertiser’s KYC status
//
exports.updateKyc = async (req, res, next) => {
  try {
    const { id }     = req.params;
    const { status } = req.body; // expected 'verified' or 'rejected'

    const adv = await User.findOne({
      where: { id, role: 'advertiser' }
    });
    if (!adv) {
      return res.status(404).json({ message: 'Advertiser not found' });
    }

    adv.kyc_status = status;
    await adv.save();

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};

//
// 4) GET /api/admin/withdrawals
//
exports.getWithdrawals = async (req, res, next) => {
  try {
    const wds = await Withdrawal.findAll({
      where: { approved: null },
      include: [{ model: User, attributes: ['id', 'name'] }],
      order: [['created_at', 'ASC']]
    });
    res.json(wds);
  } catch (err) {
    next(err);
  }
};

//
// 5) PATCH /api/admin/withdrawals/:id
//
exports.updateWithdrawal = async (req, res, next) => {
  try {
    const { id }      = req.params;
    const { approved } = req.body; // true or false

    const wd = await Withdrawal.findByPk(id);
    if (!wd) {
      return res.status(404).json({ message: 'Withdrawal not found' });
    }

    wd.approved = approved;
    await wd.save();

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};

//
// 6) GET /api/admin/transactions
//
exports.getTransactions = async (req, res, next) => {
  try {
    const tx = await Transaction.findAll({
      include: [{ model: User, attributes: ['id', 'name'] }],
      order: [['created_at', 'DESC']]
    });
    res.json(tx);
  } catch (err) {
    next(err);
  }
};

//
// 7) GET /api/admin/videos
//
exports.getVideos = async (req, res, next) => {
  try {
    const vids = await Video.findAll({
      include: [
        { model: User, attributes: ['id', 'name'] },
        { model: AdvertiserPackage, attributes: ['id', 'name'] }
      ],
      order: [['created_at', 'DESC']]
    });

    // Shape the response to include only the fields your frontend expects
    const resp = vids.map(v => ({
      id:         v.id,
      url:        v.url,
      user:       v.User,
      package:    v.AdvertiserPackage,
      created_at: v.created_at
    }));

    res.json(resp);
  } catch (err) {
    next(err);
  }
};