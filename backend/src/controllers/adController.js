// backend/src/controllers/adController.js
// Enhanced ad controller with verification system

const { Ad, User, AdvertiserPackage, AdAppeal, AdVerificationHistory } = require('../models');
const { Op } = require('sequelize');

// Submit ad for review (NEW METHOD)
const submitAdForReview = async (req, res) => {
  try {
    // Prevent admin users from submitting ads for review
    if (req.user.id === 0) {
      return res.status(403).json({
        success: false,
        message: 'Admin users cannot submit ads for review'
      });
    }
    
    const { ad_id } = req.params;
    const user_id = req.user.id;

    const ad = await Ad.findOne({
      where: { id: ad_id, advertiserId: user_id },
      include: [{ model: User, as: 'advertiser', attributes: ['id', 'name', 'company_name'] }]
    });

    if (!ad) {
      return res.status(404).json({ 
        success: false, 
        message: 'Ad not found',
        error: 'AD_NOT_FOUND'
      });
    }

    if (ad.verification_status !== 'pending') {
      return res.status(400).json({ 
        success: false, 
        message: 'Ad is already submitted or processed',
        error: 'INVALID_STATUS'
      });
    }

    // Check if ad has required fields for review
    if (!ad.title || !ad.description || !ad.mediaUrl) {
      return res.status(400).json({ 
        success: false, 
        message: 'Ad must have title, description, and media before submission',
        error: 'INCOMPLETE_AD'
      });
    }

    // Set review deadline (24 hours from now)
    const reviewDeadline = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await ad.update({
      submitted_for_review_at: new Date(),
      review_deadline: reviewDeadline,
      status: 'pending_review' // New status for review period
    });

    // Create verification history
    await AdVerificationHistory.create({
      ad_id: ad_id,
      action: 'submitted',
      admin_id: null,
      notes: 'Ad submitted for review by advertiser',
      ip_address: req.ip,
      user_agent: req.get('User-Agent')
    });

    console.log(`📝 Ad ${ad_id} submitted for review by advertiser ${user_id}`);

    res.json({
      success: true,
      message: 'Ad submitted for review successfully',
      data: {
        ad_id: ad_id,
        review_deadline: reviewDeadline,
        estimated_review_time: '24 hours',
        status: 'pending_review'
      }
    });
  } catch (error) {
    console.error('❌ Error submitting ad for review:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to submit ad for review',
      error: 'INTERNAL_ERROR'
    });
  }
};

// Submit appeal (NEW METHOD)
const submitAppeal = async (req, res) => {
  try {
    // Prevent admin users from submitting appeals
    if (req.user.id === 0) {
      return res.status(403).json({
        success: false,
        message: 'Admin users cannot submit appeals'
      });
    }
    
    const { ad_id } = req.params;
    const { appeal_reason, appeal_evidence } = req.body;
    const user_id = req.user.id;

    if (!appeal_reason || appeal_reason.trim().length < 10) {
      return res.status(400).json({ 
        success: false, 
        message: 'Appeal reason must be at least 10 characters long',
        error: 'INVALID_REASON'
      });
    }

    const ad = await Ad.findOne({
      where: { 
        id: ad_id, 
        advertiserId: user_id, 
        verification_status: 'rejected' 
      }
    });

    if (!ad) {
      return res.status(404).json({ 
        success: false, 
        message: 'Ad not found or not rejected',
        error: 'AD_NOT_FOUND_OR_NOT_REJECTED'
      });
    }

    // Check if appeal already exists
    const existingAppeal = await AdAppeal.findOne({
      where: { ad_id: ad_id, status: 'pending' }
    });

    if (existingAppeal) {
      return res.status(400).json({ 
        success: false, 
        message: 'Appeal already submitted for this ad',
        error: 'APPEAL_ALREADY_EXISTS'
      });
    }

    // Create appeal
    const appeal = await AdAppeal.create({
      ad_id: ad_id,
      advertiser_id: user_id,
      appeal_reason: appeal_reason.trim(),
      appeal_evidence: appeal_evidence ? appeal_evidence.trim() : null,
      status: 'pending'
    });

    // Set appeal deadline (7 days from now)
    appeal.setDeadline();
    await appeal.save();

    // Update ad status
    await ad.update({
      verification_status: 'under_appeal'
    });

    // Create verification history
    await AdVerificationHistory.create({
      ad_id: ad_id,
      action: 'appeal_submitted',
      admin_id: null,
      notes: 'Appeal submitted by advertiser',
      metadata: { appeal_reason: appeal_reason.trim() },
      ip_address: req.ip,
      user_agent: req.get('User-Agent')
    });

    console.log(`📝 Appeal submitted for ad ${ad_id} by advertiser ${user_id}`);

    res.json({
      success: true,
      message: 'Appeal submitted successfully',
      data: {
        appeal_id: appeal.id,
        ad_id: ad_id,
        appeal_reason: appeal_reason.trim(),
        appeal_deadline: appeal.appeal_deadline,
        status: 'under_appeal'
      }
    });
  } catch (error) {
    console.error('❌ Error submitting appeal:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to submit appeal',
      error: 'INTERNAL_ERROR'
    });
  }
};

// Get ad verification status
const getAdVerificationStatus = async (req, res) => {
  try {
    // Prevent admin users from accessing ad verification status
    if (req.user.id === 0) {
      return res.status(403).json({
        success: false,
        message: 'Admin users cannot access ad verification status'
      });
    }
    
    const { ad_id } = req.params;
    const user_id = req.user.id;

    const ad = await Ad.findOne({
      where: { id: ad_id, advertiserId: user_id },
      attributes: [
        'id', 'title', 'verification_status', 'submitted_for_review_at', 
        'review_deadline', 'verified_at', 'admin_notes', 'rejection_reason',
        'status', 'is_active'
      ]
    });

    if (!ad) {
      return res.status(404).json({ 
        success: false, 
        message: 'Ad not found',
        error: 'AD_NOT_FOUND'
      });
    }

    // Get appeal information if ad is rejected or under appeal
    let appealInfo = null;
    if (['rejected', 'under_appeal'].includes(ad.verification_status)) {
      appealInfo = await AdAppeal.findOne({
        where: { ad_id: ad_id },
        attributes: ['id', 'status', 'appeal_reason', 'admin_response', 'created_at', 'appeal_deadline'],
        order: [['created_at', 'DESC']]
      });
    }

    // Get verification history
    const history = await AdVerificationHistory.findAll({
      where: { ad_id: ad_id },
      attributes: ['action', 'notes', 'created_at'],
      order: [['created_at', 'DESC']],
      limit: 10
    });

    res.json({
      success: true,
      data: {
        ad: ad,
        appeal: appealInfo,
        history: history,
        can_submit_appeal: ad.verification_status === 'rejected' && !appealInfo,
        can_submit_for_review: ad.verification_status === 'pending' && !ad.submitted_for_review_at
      }
    });
  } catch (error) {
    console.error('❌ Error fetching ad verification status:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch ad verification status',
      error: 'INTERNAL_ERROR'
    });
  }
};

// Get advertiser's ads with verification status
const getAdvertiserAds = async (req, res) => {
  try {
    // Prevent admin users from accessing advertiser ads
    if (req.user.id === 0) {
      return res.status(403).json({
        success: false,
        message: 'Admin users cannot access advertiser ads'
      });
    }
    
    const user_id = req.user.id;
    const { page = 1, limit = 20, status } = req.query;
    const offset = (page - 1) * limit;

    // Build where clause
    let whereClause = { advertiserId: user_id };
    if (status && status !== 'all') {
      whereClause.verification_status = status;
    }

    const ads = await Ad.findAndCountAll({
      where: whereClause,
      include: [
        { 
          model: AdvertiserPackage, 
          as: 'package', 
          attributes: ['name', 'duration', 'price_per_view'] 
        }
      ],
      attributes: [
        'id', 'title', 'description', 'mediaUrl', 'section', 'status', 'is_active',
        'verification_status', 'submitted_for_review_at', 'review_deadline',
        'verified_at', 'admin_notes', 'rejection_reason', 'budget', 'remaining_budget',
        'views', 'spent', 'created_at', 'updated_at'
      ],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    // Get verification statistics for this advertiser
    const stats = await Ad.findAll({
      where: { advertiserId: user_id },
      attributes: [
        'verification_status',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['verification_status']
    });

    const verificationStats = stats.reduce((acc, stat) => {
      acc[stat.verification_status] = parseInt(stat.dataValues.count);
      return acc;
    }, {});

    res.json({
      success: true,
      data: {
        ads: ads.rows,
        pagination: {
          current_page: parseInt(page),
          total_pages: Math.ceil(ads.count / limit),
          total_ads: ads.count
        },
        verification_stats: verificationStats
      }
    });
  } catch (error) {
    console.error('❌ Error fetching advertiser ads:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch advertiser ads',
      error: 'INTERNAL_ERROR'
    });
  }
};

module.exports = {
  submitAdForReview,
  submitAppeal,
  getAdVerificationStatus,
  getAdvertiserAds
};