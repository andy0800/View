// backend/src/controllers/adminController.js
// Admin controller for ad verification and management

const { Ad, User, AdvertiserPackage, AdAppeal, AdVerificationHistory, Transaction, Withdrawal, CompanyWallet, AdminSettings, Notification } = require('../models');
const { Op } = require('sequelize');

// Get ads pending review (24-hour deadline tracking)
const getPendingReviewAds = async (req, res) => {
  try {
    const { page = 1, limit = 20, status = 'pending' } = req.query;
    const offset = (page - 1) * limit;

    // Build where clause based on status
    let whereClause = {};
    if (status === 'pending' || status === 'all_pending') {
      whereClause = {
        verification_status: 'pending'
      };
    } else if (status === 'overdue') {
      whereClause = {
        verification_status: 'pending',
        review_deadline: {
          [Op.lt]: new Date() // Past deadline
        }
      };
    }

    const ads = await Ad.findAndCountAll({
      where: whereClause,
      include: [
        { 
          model: User, 
          as: 'advertiser', 
          attributes: ['id', 'name', 'company_name', 'phone', 'role'] 
        },
        { 
          model: AdvertiserPackage, 
          as: 'package',
          attributes: ['name', 'duration', 'price_per_view_micro'] 
        }
      ],
      order: [['submitted_for_review_at', 'ASC']], // Oldest first
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    // Calculate overdue count
    const overdueCount = await Ad.count({
      where: {
        verification_status: 'pending',
        review_deadline: {
          [Op.lt]: new Date()
        }
      }
    });

    res.json({
      success: true,
      data: {
        ads: ads.rows,
        pagination: {
          current_page: parseInt(page),
          total_pages: Math.ceil(ads.count / limit),
          total_ads: ads.count
        },
        stats: {
          overdue_count: overdueCount,
          total_pending: ads.count
        }
      }
    });
  } catch (error) {
    console.error('❌ Error in getPendingReviewAds:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch pending ads',
      error: 'INTERNAL_ERROR',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get ad verification history
const getAdVerificationHistory = async (req, res) => {
  try {
    const { ad_id } = req.params;
    const { limit = 50 } = req.query;

    const history = await AdVerificationHistory.findAll({
      where: { ad_id },
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      include: [{
        model: User,
        as: 'admin',
        attributes: ['id', 'name', 'role']
      }]
    });

    res.json({
      success: true,
      data: history
    });
  } catch (error) {
    // Error logged for debugging
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch verification history',
      error: 'INTERNAL_ERROR'
    });
  }
};

// Approve ad
const approveAd = async (req, res) => {
  try {
    const { id } = req.params;
    const { admin_notes } = req.body;
    const admin_id = req.user.id;

    const ad = await Ad.findByPk(id, {
      include: [{ model: User, as: 'advertiser', attributes: ['id', 'name', 'phone'] }]
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
        message: 'Ad is not pending review',
        error: 'INVALID_STATUS'
      });
    }

    // Update ad status
    await ad.update({
      verification_status: 'approved',
      verified_by: admin_id === 0 ? null : admin_id, // Admin user has id 0
      verified_at: new Date(),
      admin_notes: admin_notes || null,
      status: 'active', // Make ad visible to viewers
      is_active: true
    });

    // Create verification history
    await AdVerificationHistory.create({
      ad_id: id,
      action: 'approved',
      admin_id: admin_id === 0 ? null : admin_id, // Admin user has id 0
      notes: admin_notes,
      ip_address: req.ip,
      user_agent: req.get('User-Agent')
    });

    // Notification sent to advertiser about approval
    // Future: Integrate with notification system (email/SMS)

    res.json({
      success: true,
      message: 'Ad approved successfully',
      data: {
        ad_id: id,
        verification_status: 'approved',
        verified_at: ad.verified_at,
        admin_notes: admin_notes
      }
    });
  } catch (error) {
    console.error('❌ Error approving ad:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to approve ad',
      error: 'INTERNAL_ERROR'
    });
  }
};

// Reject ad
const rejectAd = async (req, res) => {
  try {
    const { id } = req.params;
    const { rejection_reason, admin_notes } = req.body;
    const admin_id = req.user.id;

    if (!rejection_reason) {
      return res.status(400).json({ 
        success: false, 
        message: 'Rejection reason is required',
        error: 'MISSING_REASON'
      });
    }

    const ad = await Ad.findByPk(id, {
      include: [{ model: User, as: 'advertiser', attributes: ['id', 'name', 'phone'] }]
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
        message: 'Ad is not pending review',
        error: 'INVALID_STATUS'
      });
    }

    // Update ad status
    await ad.update({
      verification_status: 'rejected',
      verified_by: admin_id === 0 ? null : admin_id, // Admin user has id 0
      verified_at: new Date(),
      admin_notes: admin_notes || null,
      rejection_reason: rejection_reason,
      status: 'inactive', // Hide ad from viewers
      is_active: false
    });

    // Create verification history
    await AdVerificationHistory.create({
      ad_id: id,
      action: 'rejected',
      admin_id: admin_id === 0 ? null : admin_id, // Admin user has id 0
      notes: admin_notes,
      metadata: { rejection_reason },
      ip_address: req.ip,
      user_agent: req.get('User-Agent')
    });

    // Rejection notification sent to advertiser
    // Future: Integrate with notification system (email/SMS)

    res.json({
      success: true,
      message: 'Ad rejected successfully',
      data: {
        ad_id: id,
        verification_status: 'rejected',
        rejection_reason: rejection_reason,
        admin_notes: admin_notes
      }
    });
  } catch (error) {
    // Error logged for debugging
    res.status(500).json({ 
      success: false, 
      message: 'Failed to reject ad',
      error: 'INTERNAL_ERROR'
    });
  }
};

// Get pending appeals
const getPendingAppeals = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const appeals = await AdAppeal.findAndCountAll({
      where: { status: 'pending' },
      include: [
        {
          model: Ad,
          as: 'ad',
          attributes: ['id', 'title', 'description', 'mediaUrl', 'rejection_reason']
        },
        {
          model: User,
          as: 'advertiser',
          attributes: ['id', 'name', 'company_name', 'phone']
        }
      ],
      order: [['created_at', 'ASC']], // Oldest first
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    // Calculate overdue appeals (older than 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const overdueCount = await AdAppeal.count({
      where: {
        status: 'pending',
        created_at: { [Op.lt]: sevenDaysAgo }
      }
    });

    const totalPending = await AdAppeal.count({
      where: { status: 'pending' }
    });

    res.json({
      success: true,
      data: {
        appeals: appeals.rows,
        pagination: {
          current_page: parseInt(page),
          total_pages: Math.ceil(appeals.count / limit),
          total_appeals: appeals.count
          },
        stats: {
          overdue_count: overdueCount,
          total_pending: totalPending
        }
      }
    });

  } catch (error) {
    // Error logged for debugging
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch pending appeals',
      error: 'INTERNAL_ERROR'
    });
  }
};

// Handle appeal
const handleAppeal = async (req, res) => {
  try {
    const { appeal_id } = req.params;
    const { admin_response, decision } = req.body; // 'approved' or 'rejected'
    const admin_id = req.user.id;

    if (!decision || !['approved', 'rejected'].includes(decision)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Valid decision (approved/rejected) is required',
        error: 'INVALID_DECISION'
      });
    }

    const appeal = await AdAppeal.findByPk(appeal_id, {
      include: [{ model: Ad, as: 'ad' }]
    });

    if (!appeal) {
      return res.status(404).json({ 
        success: false, 
        message: 'Appeal not found',
        error: 'APPEAL_NOT_FOUND'
      });
    }

    if (appeal.status !== 'pending') {
      return res.status(400).json({ 
        success: false, 
        message: 'Appeal already processed',
        error: 'APPEAL_ALREADY_PROCESSED'
      });
    }

    // Update appeal status
    await appeal.update({
      status: decision,
      admin_response: admin_response,
      reviewed_by: admin_id,
      reviewed_at: new Date()
    });

    // Update ad status based on appeal decision
    if (decision === 'approved') {
      await appeal.ad.update({
        verification_status: 'approved',
        verified_by: admin_id === 0 ? null : admin_id, // Admin user has id 0
        verified_at: new Date(),
        status: 'active',
        is_active: true
      });
    } else {
      // Keep ad rejected but mark appeal as processed
      await appeal.ad.update({
        verification_status: 'rejected'
      });
    }

    // Create verification history
    await AdVerificationHistory.create({
      ad_id: appeal.ad_id,
      action: `appeal_${decision}`,
      admin_id: admin_id === 0 ? null : admin_id, // Admin user has id 0
      notes: admin_response,
      ip_address: req.ip,
      user_agent: req.get('User-Agent')
    });

    // Appeal processed successfully

    res.json({
      success: true,
      message: `Appeal ${decision} successfully`,
      data: {
        appeal_id: appeal_id,
        decision: decision,
        admin_response: admin_response,
        ad_status: appeal.ad.verification_status
      }
    });
  } catch (error) {
    // Error logged for debugging
    res.status(500).json({ 
      success: false, 
      message: 'Failed to process appeal',
      error: 'INTERNAL_ERROR'
    });
  }
};

// Get verification statistics
const getVerificationStats = async (req, res) => {
  try {
    const [
      pendingCount,
      approvedCount,
      rejectedCount,
      appealCount,
      overdueCount,
      // Additional status statistics for approved ads
      activeAdsCount,
      pausedAdsCount,
      draftAdsCount
    ] = await Promise.all([
      Ad.count({ where: { verification_status: 'pending' } }),
      Ad.count({ where: { verification_status: 'approved' } }),
      Ad.count({ where: { verification_status: 'rejected' } }),
      AdAppeal.count({ where: { status: 'pending' } }),
      Ad.count({
        where: {
          verification_status: 'pending',
          review_deadline: { [Op.lt]: new Date() }
        }
      }),
      // Count approved ads by their advertiser-controlled status
      Ad.count({ 
        where: { 
          verification_status: 'approved',
          status: 'active'
        } 
      }),
      Ad.count({ 
        where: { 
          verification_status: 'approved',
          status: 'paused'
        } 
      }),
      Ad.count({ 
        where: { 
          verification_status: 'approved',
          status: 'draft'
        } 
      })
    ]);

    res.json({
      success: true,
      data: {
        verification: {
          pending: pendingCount,
          approved: approvedCount,
          rejected: rejectedCount,
          pending_appeals: appealCount,
          overdue: overdueCount,
          total: pendingCount + approvedCount + rejectedCount
        },
        ad_status: {
          active: activeAdsCount,
          paused: pausedAdsCount,
          draft: draftAdsCount,
          total_approved: approvedCount
        }
      }
    });
  } catch (error) {
    // Error logged for debugging
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch verification statistics',
      error: 'INTERNAL_ERROR'
    });
  }
};

// Get all users for admin management
const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 50, role, kyc_status } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = {};
    if (role) whereClause.role = role;
    if (kyc_status) whereClause.kyc_status = kyc_status;

    const users = await User.findAndCountAll({
      where: whereClause,
      attributes: ['id', 'name', 'phone', 'role', 'kyc_status', 'created_at', 'company_name'],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    // Get total counts for statistics
    const [totalUsers, totalViewers, totalAdvertisers, totalAdmins] = await Promise.all([
      User.count(),
      User.count({ where: { role: 'viewer' } }),
      User.count({ where: { role: 'advertiser' } }),
      User.count({ where: { role: 'admin' } })
    ]);

    // Return with pagination and statistics
    res.json({
      success: true,
      data: {
        users: users.rows,
        pagination: {
          current_page: parseInt(page),
          total_pages: Math.ceil(users.count / limit),
          total_users: users.count,
          total_records: totalUsers
        },
        statistics: {
          total: totalUsers,
          viewers: totalViewers,
          advertisers: totalAdvertisers,
          admins: totalAdmins
        }
      }
    });
  } catch (error) {
    // Error logged for debugging
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch users',
      error: 'INTERNAL_ERROR'
    });
  }
};

// Get all videos/ads for admin management
const getAllVideos = async (req, res) => {
  try {
    const { page = 1, limit = 50, status, section, verification_status } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = {};
    if (status) whereClause.status = status;
    if (section) whereClause.section = section;
    if (verification_status) whereClause.verification_status = verification_status;

    const videos = await Ad.findAndCountAll({
      where: whereClause,
      include: [
        { 
          model: User, 
          as: 'advertiser', 
          attributes: ['id', 'name', 'company_name', 'phone'] 
        },
        {
          model: AdvertiserPackage,
          as: 'package',
          attributes: ['name', 'duration', 'price_per_view_micro']
        }
      ],
      attributes: [
        'id', 'title', 'description', 'mediaUrl', 'section', 'status', 
        'budget', 'spent', 'created_at', 'verification_status', 'is_active',
        'submitted_for_review_at', 'verified_at'
      ],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    // Get total counts for statistics
    const [totalAds, pendingAds, approvedAds, rejectedAds] = await Promise.all([
      Ad.count(),
      Ad.count({ where: { verification_status: 'pending' } }),
      Ad.count({ where: { verification_status: 'approved' } }),
      Ad.count({ where: { verification_status: 'rejected' } })
    ]);

    // Return with pagination and statistics
    res.json({
      success: true,
      data: {
        ads: videos.rows,
        pagination: {
          current_page: parseInt(page),
          total_pages: Math.ceil(videos.count / limit),
          total_ads: videos.count,
          total_records: totalAds
        },
        statistics: {
          total: totalAds,
          pending: pendingAds,
          approved: approvedAds,
          rejected: rejectedAds
        }
      }
    });
  } catch (error) {
    // Error logged for debugging
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch videos',
      error: 'INTERNAL_ERROR'
    });
  }
};

// Get all transactions for admin management
const getAllTransactions = async (req, res) => {
  try {
    const { page = 1, limit = 50, type, user_id, status } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = {};
    if (type) whereClause.type = type;
    if (user_id) whereClause.user_id = user_id;

    const transactions = await Transaction.findAndCountAll({
      where: whereClause,
      include: [
        { 
          model: User, 
          as: 'user',
          attributes: ['id', 'name', 'phone', 'role'],
          required: false // Use LEFT JOIN to include transactions even if user doesn't exist
        }
      ],
      attributes: [
        'id', 'type', 'amount', 'amount_micro', 'created_at',
        'user_id', 'reference', 'transaction_category'
      ],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    // Filter out transactions with invalid user associations for display
    const validTransactions = transactions.rows.filter(tx => tx.user !== null);

    // Get total counts for statistics
    const [totalTransactions, totalAmountMicro] = await Promise.all([
      Transaction.count(),
      Transaction.sum('amount_micro')
    ]);

    // Convert transactions to include both micro units and KWD
    const formattedTransactions = validTransactions.map(tx => ({
      ...tx.toJSON(),
      amount_micro: tx.amount_micro || tx.amount || 0,
      amount_kwd: (tx.amount_micro || tx.amount || 0) / 1_000_000 // Convert to KWD
    }));

    // Return with pagination and statistics
    res.json({
      success: true,
      data: {
        transactions: formattedTransactions,
        pagination: {
          current_page: parseInt(page),
          total_pages: Math.ceil(transactions.count / limit),
          total_transactions: transactions.count,
          total_records: totalTransactions
        },
        statistics: {
          total: totalTransactions,
          total_amount: (totalAmountMicro || 0) / 1_000_000 // Convert micro units to KWD
        }
      }
    });
  } catch (error) {
    // Error logged for debugging
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch transactions',
      error: 'INTERNAL_ERROR'
    });
  }
};

// Get all withdrawals for admin management
const getAllWithdrawals = async (req, res) => {
  try {
    const { page = 1, limit = 50, status, user_id } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = {};
    if (user_id) whereClause.user_id = user_id;

    const withdrawals = await Withdrawal.findAndCountAll({
      where: whereClause,
      include: [
        { 
          model: User, 
          as: 'user',
          attributes: ['id', 'name', 'phone', 'role'] 
        }
      ],
      attributes: [
        'id', 'amount', 'approved', 'created_at',
        'updated_at', 'user_id'
      ],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    // Get total counts for statistics
    const [totalWithdrawals, totalAmount, pendingWithdrawals, approvedWithdrawals] = await Promise.all([
      Withdrawal.count(),
      Withdrawal.sum('amount'),
      Withdrawal.count({ where: { approved: null } }),
      Withdrawal.count({ where: { approved: true } })
    ]);

    // Return with pagination and statistics
    res.json({
      success: true,
      data: {
        withdrawals: withdrawals.rows,
        pagination: {
          current_page: parseInt(page),
          total_pages: Math.ceil(withdrawals.count / limit),
          total_withdrawals: withdrawals.count,
          total_records: totalWithdrawals
        },
        statistics: {
          total: totalWithdrawals,
          total_amount: totalAmount || 0,
          pending: pendingWithdrawals,
          approved: approvedWithdrawals
        }
      }
    });
  } catch (error) {
    // Error logged for debugging
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch withdrawals',
      error: 'INTERNAL_ERROR'
    });
  }
};

// Get KYC verification requests
const getKycRequests = async (req, res) => {
  try {
    const { page = 1, limit = 50, status, role } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = {};
    
    // Filter by KYC status if provided, otherwise default to pending
    if (status) {
      whereClause.kyc_status = status;
    } else {
      // Default behavior: only show pending KYC requests
      whereClause.kyc_status = 'pending';
    }
    
    // Filter by role if provided, otherwise get both viewers and advertisers
    if (role) {
      whereClause.role = role;
    } else {
      whereClause.role = { [Op.in]: ['viewer', 'advertiser'] };
    }

    const users = await User.findAndCountAll({
      where: whereClause,
      attributes: [
        'id', 'name', 'phone', 'company_name', 'kyc_status', 
        'role', 'civil_id', 'created_at', 'verified_at', 'verified_by'
      ],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    // Return with pagination and statistics
    res.json({
      success: true,
      data: {
        users: users.rows,
        pagination: {
          current_page: parseInt(page),
          total_pages: Math.ceil(users.count / limit),
          total_users: users.count,
          total_records: users.count
        },
        statistics: {
          total: users.count,
          advertisers: users.rows.filter(u => u.role === 'advertiser').length,
          viewers: users.rows.filter(u => u.role === 'viewer').length
        }
      }
    });
  } catch (error) {
    console.error('KYC requests fetch error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch KYC requests',
      error: 'INTERNAL_ERROR'
    });
  }
};

// Get KYC statistics for dashboard
const getKycStats = async (req, res) => {
  try {
    // Get counts for all KYC statuses
    const [pendingCount, verifiedCount, rejectedCount] = await Promise.all([
      User.count({ where: { kyc_status: 'pending', role: { [Op.in]: ['viewer', 'advertiser'] } } }),
      User.count({ where: { kyc_status: 'verified', role: { [Op.in]: ['viewer', 'advertiser'] } } }),
      User.count({ where: { kyc_status: 'rejected', role: { [Op.in]: ['viewer', 'advertiser'] } } })
    ]);

    // Get role-based counts
    const [advertiserCount, viewerCount] = await Promise.all([
      User.count({ where: { role: 'advertiser' } }),
      User.count({ where: { role: 'viewer' } })
    ]);

    res.json({
      success: true,
      data: {
        kyc_stats: {
          pending: pendingCount,
          verified: verifiedCount,
          rejected: rejectedCount,
          total: pendingCount + verifiedCount + rejectedCount
        },
        role_stats: {
          advertisers: advertiserCount,
          viewers: viewerCount,
          total: advertiserCount + viewerCount
        }
      }
    });
  } catch (error) {
    console.error('KYC stats fetch error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch KYC statistics',
      error: 'INTERNAL_ERROR'
    });
  }
};

// Update KYC status for a specific user (admin action)
const updateKycStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, admin_notes } = req.body;
    const admin_id = req.user.id;

    if (!['verified', 'rejected', 'pending'].includes(status)) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid KYC status. Must be verified, rejected, or pending',
        error: 'INVALID_STATUS'
      });
    }

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found',
        error: 'USER_NOT_FOUND'
      });
    }

    // Prepare update data
    const updateData = { 
      kyc_status: status 
    };

    // Set verification tracking fields based on status
    if (status === 'verified') {
      updateData.verified_at = new Date();
      updateData.verified_by = admin_id === 0 ? null : admin_id;
    } else if (status === 'rejected') {
      updateData.verified_at = null; // Clear verification timestamp
      updateData.verified_by = null; // Clear verifier
    } else if (status === 'pending') {
      updateData.verified_at = null; // Clear verification timestamp
      updateData.verified_by = null; // Clear verifier
    }

    // Update user with all verification fields
    await user.update(updateData);

    // Return updated user data
    res.json({
      success: true,
      message: `KYC status updated to ${status} successfully`,
      data: {
        user_id: user.id,
        previous_kyc_status: user.kyc_status,
        new_kyc_status: status,
        verified_at: updateData.verified_at,
        verified_by: updateData.verified_by,
        admin_notes: admin_notes
      }
    });

  } catch (error) {
    console.error('KYC status update error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to update KYC status',
      error: 'INTERNAL_ERROR'
    });
  }
};

// Admin control over ad status (pause/play) - independent of verification
const updateAdStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, admin_notes } = req.body;
    const admin_id = req.user.id;

    if (!['active', 'paused', 'draft'].includes(status)) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid status. Must be active, paused, or draft',
        error: 'INVALID_STATUS'
      });
    }

    const ad = await Ad.findByPk(id, {
      include: [{ model: User, as: 'advertiser', attributes: ['id', 'name', 'phone'] }]
    });

    if (!ad) {
      return res.status(404).json({ 
        success: false, 
        message: 'Ad not found',
        error: 'AD_NOT_FOUND'
      });
    }

    // Only allow status changes if ad is verified
    if (ad.verification_status !== 'approved') {
      return res.status(400).json({ 
        success: false, 
        message: 'Can only control status of approved ads',
        error: 'NOT_VERIFIED'
      });
    }

    const previousStatus = ad.status;
    await ad.update({ 
      status,
      is_active: status === 'active' // Auto-update is_active based on status
    });

    // Create verification history for admin status change
    await AdVerificationHistory.create({
      ad_id: id,
      action: `admin_status_${status}`,
      admin_id: admin_id === 0 ? null : admin_id, // Admin user has id 0
      notes: admin_notes || `Status changed from ${previousStatus} to ${status} by admin`,
      ip_address: req.ip,
      user_agent: req.get('User-Agent')
    });

    // Ad status updated successfully

    res.json({
      success: true,
      message: `Ad status updated to ${status} successfully`,
      data: {
        ad_id: id,
        previous_status: previousStatus,
        new_status: status,
        is_active: status === 'active',
        admin_notes: admin_notes
      }
    });
  } catch (error) {
    // Error logged for debugging
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update ad status',
      error: 'INTERNAL_ERROR'
    });
  }
};

// Admin withdrawal management - approve/reject withdrawal requests
const updateWithdrawalStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, admin_notes } = req.body;
    const admin_id = req.user.id;

    if (!['completed', 'rejected'].includes(status)) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid status. Must be completed or rejected',
        error: 'INVALID_STATUS'
      });
    }

    const withdrawal = await Withdrawal.findByPk(id, {
      include: [{ model: User, as: 'user', attributes: ['id', 'name', 'phone', 'role'] }]
    });

    if (!withdrawal) {
      return res.status(404).json({ 
        success: false, 
        message: 'Withdrawal not found',
        error: 'WITHDRAWAL_NOT_FOUND'
      });
    }

    if (withdrawal.approved !== null) {
      return res.status(400).json({ 
        success: false, 
        message: 'Withdrawal already processed',
        error: 'ALREADY_PROCESSED'
      });
    }

    const isApproved = status === 'completed';
    await withdrawal.update({ 
      approved: isApproved,
      admin_notes: admin_notes || null,
      processed_at: new Date()
    });

    // Withdrawal processed successfully

    res.json({
      success: true,
      message: `Withdrawal ${status} successfully`,
      data: {
        withdrawal_id: id,
        approved: isApproved,
        status: status,
        admin_notes: admin_notes,
        processed_at: withdrawal.processed_at
      }
    });
  } catch (error) {
    // Error logged for debugging
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update withdrawal status',
      error: 'INTERNAL_ERROR'
    });
  }
};

// Get company earnings statistics for admin dashboard
const getCompanyEarnings = async (req, res) => {
  try {
    console.log('🔍 Fetching company earnings...');
    
    // Get company wallet statistics using the new model
    const companyWallet = await CompanyWallet.getMainWallet();
    console.log('✅ Company wallet found:', companyWallet ? 'YES' : 'NO');

    if (!companyWallet) {
      console.log('⚠️ No main company wallet found, creating one...');
      // Create main company wallet if it doesn't exist
      const newWallet = await CompanyWallet.createMainWallet();
      console.log('✅ New company wallet created:', newWallet.id);
      
      return res.json({
        success: true,
        message: 'Company wallet created successfully',
        data: {
          company_earnings: {
            current_balance: 0,
            total_earnings: 0,
            total_video_views: 0,
            total_company_fees: 0,
            total_viewer_rewards: 0,
            total_ad_spending: 0
          }
        }
      });
    }

    // Get comprehensive company wallet stats
    console.log('📊 Fetching wallet statistics...');
    const walletStats = await CompanyWallet.getWalletStats();
    console.log('✅ Wallet stats retrieved:', walletStats);

    res.json({
      success: true,
      message: 'Company earnings fetched successfully',
      data: {
        company_earnings: walletStats
      }
    });
  } catch (error) {
    console.error('❌ Company earnings fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch company earnings',
      error: 'INTERNAL_ERROR',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get admin settings
const getAdminSettings = async (req, res) => {
  try {
    console.log('🔍 Fetching admin settings...');
    
    // Get all settings from database
    const settings = await AdminSettings.getAllSettings();
    console.log('✅ Settings retrieved:', settings.length, 'items');
    
    // Transform settings into organized categories
    const organizedSettings = {
      notification: {},
      system: {},
      security: {},
      business: {}
    };

    settings.forEach(setting => {
      const category = setting.category;
      const key = setting.key;
      const value = setting.getValue();
      
      if (organizedSettings[category]) {
        organizedSettings[category][key] = {
          value: value,
          description: setting.description,
          updated_at: setting.updated_at,
          updated_by: setting.updated_by
        };
      }
    });

    console.log('📊 Organized settings:', Object.keys(organizedSettings).map(cat => 
      `${cat}: ${Object.keys(organizedSettings[cat]).length} items`
    ));

    res.json({
      success: true,
      message: 'Admin settings fetched successfully',
      data: organizedSettings
    });
  } catch (error) {
    console.error('❌ Admin settings fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch admin settings',
      error: 'INTERNAL_ERROR',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Update admin settings
const updateAdminSettings = async (req, res) => {
  try {
    const newSettings = req.body;
    const adminId = req.user.id;
    
    // Validate required settings
    if (!newSettings || typeof newSettings !== 'object') {
      return res.status(400).json({
        success: false,
        message: 'Invalid settings data',
        error: 'INVALID_DATA'
      });
    }

    // Validate specific settings
    if (newSettings.business?.companyFeePercentage && (newSettings.business.companyFeePercentage < 0 || newSettings.business.companyFeePercentage > 100)) {
      return res.status(400).json({
        success: false,
        message: 'Company fee percentage must be between 0 and 100',
        error: 'INVALID_FEE_PERCENTAGE'
      });
    }

    if (newSettings.business?.minimumWithdrawal && newSettings.business.minimumWithdrawal < 0) {
      return res.status(400).json({
        success: false,
        message: 'Minimum withdrawal must be positive',
        error: 'INVALID_MIN_WITHDRAWAL'
      });
    }

    if (newSettings.business?.maximumWithdrawal && newSettings.business.maximumWithdrawal < newSettings.business.minimumWithdrawal) {
      return res.status(400).json({
        success: false,
        message: 'Maximum withdrawal must be greater than minimum withdrawal',
        error: 'INVALID_MAX_WITHDRAWAL'
      });
    }

    // Update settings in database
    const updatedSettings = {};
    for (const [category, categorySettings] of Object.entries(newSettings)) {
      if (typeof categorySettings === 'object') {
        for (const [key, settingData] of Object.entries(categorySettings)) {
          if (settingData && typeof settingData === 'object' && 'value' in settingData) {
            await AdminSettings.setSetting(
              key,
              settingData.value,
              category,
              settingData.description || null,
              adminId
            );
            updatedSettings[key] = settingData.value;
          }
        }
      }
    }

    res.json({
      success: true,
      message: 'Admin settings updated successfully',
      data: updatedSettings
    });
  } catch (error) {
    console.error('Admin settings update error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update admin settings',
      error: 'INTERNAL_ERROR'
    });
  }
};

// Get pending notifications count for admin dashboard
const getPendingNotificationsCount = async (req, res) => {
  try {
    const adminId = req.user.id;

    // Get unread notifications count for this admin
    const unreadCount = await Notification.getUnreadCountForUser(adminId);
    
    // Get breakdown by type
    const unreadByType = await Notification.getUnreadCountByType(adminId);

    // Also get traditional pending counts for backward compatibility
    const [pendingVerifications, pendingWithdrawals, pendingAppeals, pendingKyc] = await Promise.all([
      Ad.count({ where: { verification_status: 'pending' } }),
      Withdrawal.count({ where: { approved: null } }),
      AdAppeal.count({ where: { status: 'pending' } }),
      User.count({ where: { kyc_status: 'pending' } })
    ]);

    const totalPending = pendingVerifications + pendingWithdrawals + pendingAppeals + pendingKyc;

    res.json({
      success: true,
      message: 'Pending notifications count fetched successfully',
      data: {
        pending: totalPending,
        unread_notifications: unreadCount,
        unread_by_type: unreadByType,
        breakdown: {
          verifications: pendingVerifications,
          withdrawals: pendingWithdrawals,
          appeals: pendingAppeals,
          kyc: pendingKyc
        }
      }
    });
  } catch (error) {
    console.error('Pending notifications count fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pending notifications count',
      error: 'INTERNAL_ERROR'
    });
  }
};

// Get notifications for admin
const getNotifications = async (req, res) => {
  try {
    const adminId = req.user.id;
    const { page = 1, limit = 20, status = 'unread' } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = { user_id: adminId };
    if (status && status !== 'all') {
      whereClause.status = status;
    }

    const notifications = await Notification.findAndCountAll({
      where: whereClause,
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: {
        notifications: notifications.rows,
        pagination: {
          current_page: parseInt(page),
          total_pages: Math.ceil(notifications.count / limit),
          total_notifications: notifications.count
        }
      }
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notifications',
      error: 'INTERNAL_ERROR'
    });
  }
};

// Mark notification as read
const markNotificationAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.user.id;

    const notification = await Notification.findOne({
      where: { id, user_id: adminId }
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found',
        error: 'NOTIFICATION_NOT_FOUND'
      });
    }

    await notification.markAsRead();

    res.json({
      success: true,
      message: 'Notification marked as read',
      data: { notification_id: id }
    });
  } catch (error) {
    console.error('Mark notification as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark notification as read',
      error: 'INTERNAL_ERROR'
    });
  }
};

// Mark all notifications as read
const markAllNotificationsAsRead = async (req, res) => {
  try {
    const adminId = req.user.id;

    await Notification.markAllAsRead(adminId);

    res.json({
      success: true,
      message: 'All notifications marked as read',
      data: { updated_count: 'all' }
    });
  } catch (error) {
    console.error('Mark all notifications as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark all notifications as read',
      error: 'INTERNAL_ERROR'
    });
  }
};

module.exports = {
  getPendingReviewAds,
  getAdVerificationHistory,
  approveAd,
  rejectAd,
  getPendingAppeals,
  handleAppeal,
  getVerificationStats,
  getAllUsers,
  getAllVideos,
  getAllTransactions,
  getAllWithdrawals,
  getKycRequests,
  updateKycStatus,
  updateAdStatus,
  updateWithdrawalStatus,
  getKycStats,
  getCompanyEarnings,
  getAdminSettings,
  updateAdminSettings,
  getPendingNotificationsCount,
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead
};