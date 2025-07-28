// backend/src/controllers/advertiserController.js
const { Op }        = require('sequelize')
const { Ad, Wallet, Transaction, Video, User } = require('../models')
const { AD_PACKAGES } = require('../constants/advertiser')

// 1) Fetch ads for this advertiser
exports.getAds = async (req, res, next) => {
  try {
    const ads = await Ad.findAll({
      where: { advertiser_id: req.user.id },
      attributes: ['id','mediaUrl','views','spent','title','description','created_at']
    })
    return res.json(ads)
  } catch (err) { next(err) }
}

// 1b) Create new Ad + Video entry
exports.createAd = async (req, res, next) => {
  try {
    const { package_id, budget, title, description, sections = [] } = req.body

    if (!req.file) {
      return res.status(400).json({ message: 'Media file required' })
    }

    // validate sections keys if you like by comparing to your /api/sections
    // e.g. fetch allowed section list from config or DB

    const wallet = await Wallet.findOne({
      where: { user_id: req.user.id }
    })
    if (!wallet || wallet.balance < budget) {
      return res.status(400).json({ message: 'Insufficient credit' })
    }
    wallet.balance -= +budget
    await wallet.save()

    // Save ad record
    const mediaUrl = `/uploads/${req.file.filename}`

    // Here we create a Video model instead of Ad model
    const video = await Video.create({
      advertiser_id: req.user.id,
      url: mediaUrl,
      sections,        // NEW
      views: 0,
      spent: 0,
      title,
      description: description || ''
    })

    // Create an Ad to link package/budget if you still need it
    await Ad.create({
      advertiserId: req.user.id,
      mediaUrl,
      packageId: package_id,
      budget,
      views: 0,
      spent: 0,
      title,
      description: description || ''
    })

    // Log transaction
    await Transaction.create({
      user_id: req.user.id,
      type: 'debit',
      amount: budget,
      note: `Activated ad ${video.id}`
    })

    return res.status(201).json({ success: true, id: video.id })
  } catch (err) {
    next(err)
  }
}

// ... rest unchanged ...
exports.getCredit = async (req, res, next) => {
  try {
    const wallet = await Wallet.findOne({ where: { user_id: req.user.id } })
    const history = await Transaction.findAll({
      where: { user_id: req.user.id },
      order: [['created_at','DESC']],
      limit: 20
    })
    return res.json({
      balance: wallet ? wallet.balance : 0,
      history
    })
  } catch (err) { next(err) }
}

exports.depositCredit = async (req, res, next) => {
  try {
    const { amount } = req.body
    const [wallet] = await Wallet.findOrCreate({
      where: { user_id: req.user.id },
      defaults: { balance: 0 }
    })
    wallet.balance += +amount
    await wallet.save()
    await Transaction.create({
      user_id: req.user.id,
      type: 'credit',
      amount,
      note: 'Deposit'
    })
    return res.json({ balance: wallet.balance })
  } catch (err) { next(err) }
}

exports.withdrawCredit = async (req, res, next) => {
  try {
    const { amount } = req.body
    const wallet = await Wallet.findOne({ where: { user_id: req.user.id } })
    if (!wallet || wallet.balance < amount) {
      return res.status(400).json({ message: 'Insufficient balance' })
    }
    wallet.balance -= +amount
    await wallet.save()
    await Transaction.create({
      user_id: req.user.id,
      type: 'debit',
      amount,
      note: 'Withdrawal'
    })
    return res.json({ balance: wallet.balance })
  } catch (err) { next(err) }
}

exports.buyPackage = async (req, res, next) => {
  try {
    const { package_id, amount } = req.body
    const wallet = await Wallet.findOne({ where: { user_id: req.user.id } })
    if (!wallet || wallet.balance < amount) {
      return res.status(400).json({ message: 'Insufficient credit' })
    }
    wallet.balance -= +amount
    await wallet.save()
    await Transaction.create({
      user_id: req.user.id,
      type: 'debit',
      amount,
      note: `Bought package ${package_id}`
    })
    return res.json({ balance: wallet.balance })
  } catch (err) { next(err) }
}

exports.getProfile = (req, res) => {
  const {
    name, civil_id, phone,
    company_name, license_number, signatory_name, license_doc, kyc_status
  } = req.user
  res.json({
    name, civil_id, phone,
    company_name, license_number, signatory_name, license_doc, kyc_status
  })
}

exports.updateProfile = async (req, res, next) => {
  try {
    const user = req.user
    Object.assign(user, {
      name:           req.body.name,
      civil_id:       req.body.civil_id,
      phone:          req.body.phone,
      company_name:   req.body.company_name,
      license_number: req.body.license_number,
      signatory_name: req.body.signatory_name
    })
    if (req.file) {
      user.license_doc = `/uploads/${req.file.filename}`
      user.kyc_status  = 'pending'
    }
    await user.save()
    return res.json({ success: true, profile: req.body })
  } catch (err) {
    next(err)
  }
}