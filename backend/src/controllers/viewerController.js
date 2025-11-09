// backend/src/controllers/viewerController.js
const { 
  User, 
  Wallet, 
  Transaction, 
  ViewEvent, 
  Ad, 
  PurchasedPackage,
  AdvertiserPackage,
  Section,
  CompanyWallet,
  sequelize 
} = require('../models');
const { Op } = require('sequelize');
const crypto = require('crypto');

// Get viewer profile
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      include: [{
        model: Wallet,
        as: 'wallet'
      }]
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      civil_id: user.civil_id,
      civil_front_key: user.civil_front_key,
      civil_back_key: user.civil_back_key,
      kyc_status: user.kyc_status,
      wallet: user.wallet,
      verified_at: user.verified_at,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    });
  } catch (err) {
    console.error('❌ Error in getProfile:', err);
    res.status(500).json({ message: 'Failed to fetch profile' });
  }
};

// Get all business sections
exports.getSections = async (req, res) => {
  try {
    const sections = await Section.findAll({
      where: { is_active: true },
      order: [['sort_order', 'ASC'], ['title', 'ASC']],
      attributes: ['id', 'key', 'title', 'description', 'icon', 'color']
    });

    // Add ad count for each section
    const sectionsWithCount = await Promise.all(
      sections.map(async (section) => {
        const adCount = await Ad.count({
          where: {
            section: section.key,
            status: ['active', 'approved'],
            is_active: true,
            verification_status: 'approved'
          },
          include: [{
            model: PurchasedPackage,
            as: 'purchasedPackage',
            where: {
              remaining_micro: { [Op.gt]: 0 }
              // ✅ REMOVED: status: 'active' - packages are marked 'used' after ad creation
            },
            required: true
          }]
        });

        return {
          ...section.toJSON(),
          ad_count: adCount
        };
      })
    );

    res.json(sectionsWithCount);
  } catch (err) {
    console.error('❌ Failed to load sections:', err);
    res.status(500).json({ message: 'Failed to load business sections' });
  }
};

// Get videos for a specific section
exports.getSectionVideos = async (req, res) => {
  const { key } = req.params;
  
  try {
    console.log('🔍 getSectionVideos called for section:', key, 'by user:', req.user?.id);
    
    // First verify the section exists
    const section = await Section.findOne({
      where: { key, is_active: true }
    });

    if (!section) {
      console.log('❌ Section not found:', key);
      return res.status(404).json({ message: 'Business section not found' });
    }

    console.log('✅ Section found:', section.title);

    const ads = await Ad.getActiveAdsBySection(key, { limit: 50 });
    console.log(`🔍 Found ${ads.length} ads in section ${key} before watched flagging`);

    // 🔄 UPDATED: Compute watched ad IDs for this user in LAST 24 HOURS
    // This enables 24-hour recurring rewards - ads watched >24hrs ago will show as rewardable again
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const watchedRows = await ViewEvent.findAll({
      where: { 
        user_id: req.user.id, 
        is_completed: true,
        completed_at: { [Op.gte]: twentyFourHoursAgo } // ✅ Only views from last 24 hours
      },
      attributes: ['ad_id'],
      raw: true
    });
    const watchedIds = new Set(watchedRows.map(r => r.ad_id));

    // Normalize and validate media URLs; skip any ad without a valid file
    const forwardedProto = req.headers['x-forwarded-proto'];
    const proto = (Array.isArray(forwardedProto) ? forwardedProto[0] : forwardedProto) || req.protocol || 'https';
    const origin = (process.env.BACKEND_PUBLIC_URL?.trim()) || `${proto}://${req.get('host')}`;
    const path = require('path');
    const fs = require('fs');
    const normalize = url => {
      if (!url) return '';
      const u = String(url).trim();
      if (/^https?:\/\//i.test(u)) {
        try {
          const parsed = new URL(u);
          const p = parsed.pathname || '';
          if (p.startsWith('/uploads/') && !p.startsWith('/uploads/ads/')) {
            const path = require('path');
            return `${parsed.origin}/uploads/ads/${path.basename(p)}`;
          }
        } catch (_e) {}
        return u; // already absolute
      }
      // If it's already under uploads, ensure ads subfolder when missing
      if (u.startsWith('/uploads/')) {
        if (!u.startsWith('/uploads/ads/')) {
          const path = require('path');
          return `/uploads/ads/${path.basename(u)}`;
        }
        return u;
      }
      // Bare filename -> map to uploads/ads
      const parts = u.split('/');
      const filename = parts[parts.length - 1];
      return filename ? `/uploads/ads/${filename}` : '';
    };
    const absolutize = url => {
      if (!url) return '';
      const n = normalize(url);
      return /^https?:\/\//i.test(n) ? n : `${origin}${n}`;
    };
    const fileExists = url => {
      if (!url) return false;
      // If absolute URL, verify locally when it points to this backend origin
      if (/^https?:\/\//i.test(url)) {
        try {
          const abs = new URL(url);
          const thisOrigin = new URL(origin);
          if (abs.host === thisOrigin.host) {
            // Map /uploads/... to local filesystem path
            const rel = abs.pathname.replace(/^\/?uploads\//i, '');
            const filePath = path.resolve(__dirname, '..', 'uploads', rel);
            return fs.existsSync(filePath);
          }
          return true; // remote third-party URL - assume available
        } catch (_e) {
          return false;
        }
      }
      const rel = url.replace(/^\/?uploads\//i, '');
      const filePath = path.resolve(__dirname, '..', 'uploads', rel);
      return fs.existsSync(filePath);
    };

    const total = await Ad.count({
      where: {
        section: key,
        status: 'approved',
        is_active: true,
        verification_status: 'approved'
      },
      include: [{
        model: PurchasedPackage,
        as: 'purchasedPackage',
        where: {
          remaining_micro: { [Op.gt]: 0 }
          // ✅ REMOVED: status: 'active' - packages are marked 'used' after ad creation
        },
        required: true
      }]
    });

    const videos = [];
    for (const ad of ads) {
      const normalized = normalize(ad.mediaUrl);
      if (!normalized) continue; // skip missing media
      if (!fileExists(normalized)) continue; // skip non-existent file
      videos.push({
        id: ad.id,
        title: ad.title,
        description: ad.description,
        mediaUrl: absolutize(normalized),
        section: ad.section,
        section_title: section.title,
        package: {
          name: ad.package?.name || ad.purchasedPackage?.package?.name || 'Unknown',
          duration: ad.package?.duration || ad.purchasedPackage?.package?.duration || 0,
          pricePerView: ad.package?.getPricePerViewKWD ? ad.package.getPricePerViewKWD() : 
                        (ad.purchasedPackage?.package?.getPricePerViewKWD ? ad.purchasedPackage.package.getPricePerViewKWD() : 0)
        },
        advertiser: {
          name: ad.advertiser.name,
          companyName: ad.advertiser.company_name
        },
        // ✅ ADDED: CTA data for Instagram-style call-to-action buttons
        cta_data: {
          enabled: ad.cta_enabled,
          link: ad.cta_link,
          text: ad.cta_text
        },
        // New flag to indicate if this ad was already watched/rewarded by the viewer
        is_watched: watchedIds.has(ad.id)
      });
    }

    res.json({
      success: true,
      videos,
      sectionInfo: {
        key: section.key,
        title: section.title,
        description: section.description
      },
      totalUnwatched: videos.filter(v => !v.is_watched).length,
      totalAvailable: ads.length,
      pagination: {
        total,
        pages: Math.ceil(total / 50)
      }
    });
  } catch (err) {
    console.error(`❌ Failed to fetch videos for section ${key}:`, err);
    res.status(500).json({ message: 'Could not load videos for this section' });
  }
};

// Start watching an ad (creates view event with proof token)
exports.startWatchingAd = async (req, res) => {
  try {
    const { adId } = req.params;
    const userId = req.user.id;

    // Find the ad with package details
    const ad = await Ad.getAdWithPackageDetails(adId);
    if (!ad) {
      return res.status(404).json({ message: 'Ad not found or not available' });
    }

    // Check if ad is available for viewing
    if (!ad.isAvailableForViewing()) {
      return res.status(400).json({ message: 'Ad is not available for viewing' });
    }

    // 🔄 NEW: Check 24-hour reward cooldown before allowing new rewarded view
    const rewardEligibility = await ViewEvent.canUserGetRewardedAgain(userId, adId);
    if (!rewardEligibility.canReward) {
      return res.status(400).json({ 
        message: `You must wait 24 hours before earning a reward for this ad again`,
        error: 'reward_cooldown_active',
        cooldownInfo: {
          reason: rewardEligibility.reason,
          hoursSinceLastView: rewardEligibility.hoursSinceLastView,
          hoursRemaining: rewardEligibility.hoursRemaining,
          nextRewardAvailableAt: rewardEligibility.nextRewardAvailableAt,
          lastRewardedAt: rewardEligibility.lastRewardedAt
        }
      });
    }

    console.log(`✅ User ${userId} is eligible for reward:`, rewardEligibility.reason);

    // Check if user already has an incomplete view for this ad
    const existingView = await ViewEvent.findActiveByUserAndAd(userId, adId);
    if (existingView) {
      return res.json({
        message: 'View already in progress',
        viewEvent: existingView,
        proofToken: existingView.proof_token,
        requiredDuration: existingView.required_duration_ms
      });
    }

    // Generate proof token
    const nonce = crypto.randomBytes(16).toString('hex');
    const startTs = Date.now();
    const proofToken = crypto
      .createHmac('sha256', process.env.PROOF_TOKEN_SECRET || 'default-secret')
      .update(`${adId}${userId}${nonce}${startTs}`)
      .digest('hex');

    // Calculate required duration in milliseconds
    const requiredDurationMs = ad.getPackageDuration() * 1000;

    // Create view event
    const viewEvent = await ViewEvent.create({
      ad_id: adId,
      user_id: userId,
      purchased_package_id: ad.purchased_package_id,
      package_id: ad.purchasedPackage.package_id,
      proof_token: proofToken,
      proof_token_expires_at: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes expiry
      charged_micro: 0, // Will be set on completion
      viewer_reward_micro: 0, // Will be set on completion
      company_share_micro: 0, // Will be set on completion
      is_completed: false,
      watched_duration_ms: 0,
      required_duration_ms: requiredDurationMs,
      viewed_at: new Date()
    });

    res.json({
      success: true,
      message: 'View started successfully',
      viewEvent: {
        id: viewEvent.id,
        proofToken: viewEvent.proof_token,
        requiredDuration: viewEvent.required_duration_ms,
        expiresAt: viewEvent.proof_token_expires_at
      }
    });
  } catch (error) {
    console.error('Error starting ad view:', error);
    res.status(500).json({ message: 'Failed to start viewing ad' });
  }
};

// Complete watching an ad (processes reward and updates budget)
exports.completeView = async (req, res) => {
  try {
    const { adId, proofToken, watchedDurationMs } = req.body;
    const userId = req.user.id;

    if (!adId || !proofToken || !watchedDurationMs) {
      return res.status(400).json({ 
        message: 'Ad ID, proof token, and watched duration are required' 
      });
    }

    // Find and validate view event
    const viewEvent = await ViewEvent.findByProofToken(proofToken);
    if (!viewEvent) {
      return res.status(400).json({ message: 'Invalid proof token' });
    }

    if (viewEvent.user_id !== userId) {
      return res.status(403).json({ message: 'Proof token does not match user' });
    }

    if (viewEvent.ad_id !== adId) {
      return res.status(400).json({ message: 'Proof token does not match ad' });
    }

    if (viewEvent.is_completed) {
      return res.status(400).json({ message: 'View already completed' });
    }

    if (viewEvent.isProofTokenExpired()) {
      return res.status(400).json({ message: 'Proof token has expired' });
    }

    // Validate watched duration (must watch at least 95% of required duration)
    if (watchedDurationMs < (viewEvent.required_duration_ms * 0.95)) {
      return res.status(400).json({ 
        message: 'Must watch at least 95% of the video to receive reward' 
      });
    }

    // Get ad with package details
    const ad = await Ad.getAdWithPackageDetails(adId);
    if (!ad) {
      return res.status(404).json({ message: 'Ad not found' });
    }

    // Check if ad can still afford a view
    if (!ad.canAffordView()) {
      return res.status(400).json({ message: 'Ad has insufficient budget' });
    }

    // Get or create viewer wallet
    let viewerWallet = await Wallet.findByUserId(userId);
    if (!viewerWallet) {
      viewerWallet = await Wallet.createForUser(userId);
    }

    // Calculate rewards using micro-units
    const pricePerViewMicro = ad.getPackagePricePerViewMicro();
    const viewerShareMicro = ad.package.getViewerRewardMicro();
    const companyShareMicro = ad.package.getCompanyShareMicro();

    // Start database transaction
    const transaction = await sequelize.transaction();

    try {
      // Update view event
      await viewEvent.update({
        is_completed: true,
        watched_duration_ms: watchedDurationMs,
        charged_micro: pricePerViewMicro,
        viewer_reward_micro: viewerShareMicro,
        company_share_micro: companyShareMicro,
        completed_at: new Date()
      }, { transaction });

      // Deduct cost from purchased package with optimistic locking
      await ad.purchasedPackage.deductViewCost(transaction);

      // Add reward to viewer wallet
      await viewerWallet.addBalance(viewerShareMicro, transaction);

      // Create transactions
      await Transaction.createViewTransaction({
        fromWalletId: ad.purchasedPackage.id, // From purchased package
        toWalletId: viewerWallet.id, // To viewer wallet
        userId,
        amountMicro: pricePerViewMicro,
        adId,
        purchasedPackageId: ad.purchased_package_id,
        type: 'view_charge'
      }, transaction);

      await Transaction.createRewardTransaction({
        toWalletId: viewerWallet.id,
        userId,
        amountMicro: viewerShareMicro,
        adId,
        purchasedPackageId: ad.purchased_package_id
      }, transaction);

      // Create company fee transaction and update company wallet
      const companyWallet = await CompanyWallet.getOrCreateMainWallet();
      await companyWallet.addCompanyFee(companyShareMicro, transaction);
      await companyWallet.addViewerReward(viewerShareMicro, transaction);

      await Transaction.createCompanyFeeTransaction({
        toWalletId: companyWallet.id,
        amountMicro: companyShareMicro,
        adId,
        purchasedPackageId: ad.purchased_package_id
      }, transaction);

      await transaction.commit();

      res.json({
        success: true,
        message: 'View completed successfully',
        reward: viewerShareMicro / 1_000_000, // Convert to KWD
        newBalance: viewerWallet.getBalanceKWD(),
        ad: {
          id: ad.id,
          title: ad.title,
          remainingBudget: ad.purchasedPackage.getRemainingKWD()
        }
      });

    } catch (error) {
      await transaction.rollback();
      console.error('Error in completeView transaction:', error);
      res.status(500).json({ 
        message: 'Failed to complete view. Please try again.' 
      });
    }

  } catch (error) {
    console.error('Error completing view:', error);
    res.status(500).json({ message: 'Failed to complete view' });
  }
};

// Get viewer statistics
exports.getViewerStats = async (req, res) => {
  try {
    const userId = req.user.id;

    const [wallet, viewEvents] = await Promise.all([
      Wallet.findByUserId(userId),
      ViewEvent.findAll({
        where: { 
          user_id: userId,
          is_completed: true
        },
        include: [{
          model: Ad,
          as: 'ad',
          attributes: ['title', 'section']
        }]
      })
    ]);

    const totalRewards = viewEvents.reduce((sum, event) => sum + event.getViewerRewardKWD(), 0);
    const totalViews = viewEvents.length;
    const totalWatchedTime = viewEvents.reduce((sum, event) => sum + event.getWatchedDurationSeconds(), 0);

    const stats = {
      totalRewards,
      totalViews,
      totalWatchedTime,
      averageRewardPerView: totalViews > 0 ? totalRewards / totalViews : 0,
      currentBalance: wallet ? wallet.getBalanceKWD() : 0,
      recentViews: viewEvents.slice(0, 10).map(event => ({
        adTitle: event.ad.title,
        section: event.ad.section,
        reward: event.getViewerRewardKWD(),
        watchedAt: event.completed_at
      }))
    };

    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Error fetching viewer stats:', error);
    res.status(500).json({ message: 'Failed to fetch viewer statistics' });
  }
};

// Helper function to filter out already watched videos
async function filterAlreadyWatchedVideos(ads, userId) {
  if (!userId) return ads;

  const watchedAdIds = await ViewEvent.findAll({
    where: {
      user_id: userId,
      is_completed: true
    },
    include: [{
      model: Ad,
      as: 'ad',
      attributes: []
    }],
    attributes: ['ad_id'],
    raw: true
  });

  const watchedIds = new Set(watchedAdIds.map(event => event.ad_id));
  return ads.filter(ad => !watchedIds.has(ad.id));
}

// Get all ads randomly for "All Ads" tab
exports.getAllAds = async (req, res) => {
  try {
    console.log('🔍 getAllAds called by user:', req.user?.id, 'phone:', req.user?.phone);
    
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    // Get all active, approved ads with available budget
    const ads = await Ad.findAll({
      where: {
        status: ['active', 'approved'],
        is_active: true,
        verification_status: 'approved'
      },
      include: [
        {
          model: PurchasedPackage,
          as: 'purchasedPackage',
          where: {
            remaining_micro: { [Op.gt]: 0 }
            // ✅ REMOVED: status: 'active' - packages are marked 'used' after ad creation
            // We only need remaining budget > 0 for viewing
          },
          include: [{
            model: AdvertiserPackage,
            as: 'package'
          }]
        },
        {
          model: User,
          as: 'advertiser',
          attributes: ['name', 'company_name']
        }
      ],
      order: sequelize.random(), // Random order for "All Ads"
      limit,
      offset
    });

    console.log(`🔍 getAllAds: Found ${ads.length} total ads before filtering`);
    
    // 🔄 UPDATED: Compute watched ad IDs for this user in LAST 24 HOURS
    // This enables 24-hour recurring rewards - ads watched >24hrs ago will show as rewardable again
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const watchedRows = await ViewEvent.findAll({
      where: { 
        user_id: req.user.id, 
        is_completed: true,
        completed_at: { [Op.gte]: twentyFourHoursAgo } // ✅ Only views from last 24 hours
      },
      attributes: ['ad_id'],
      raw: true
    });
    const watchedIds = new Set(watchedRows.map(r => r.ad_id));
    console.log(`🔍 getAllAds: Computed watched set size (last 24hrs): ${watchedIds.size}`);

    // Transform ads for frontend with media URL validation
    const forwardedProto2 = req.headers['x-forwarded-proto'];
    const proto2 = (Array.isArray(forwardedProto2) ? forwardedProto2[0] : forwardedProto2) || req.protocol || 'https';
    const origin = (process.env.BACKEND_PUBLIC_URL?.trim()) || `${proto2}://${req.get('host')}`;
    const path = require('path');
    const fs = require('fs');
    
    const validAds = [];
    for (const ad of ads) {
      const raw = (ad.mediaUrl || '').toString().trim();

      // Case 1: Absolute remote URL (e.g., S3/CloudFront) → accept as-is
      if (/^https?:\/\//i.test(raw)) {
        validAds.push({
          id: ad.id,
          title: ad.title,
          description: ad.description,
          mediaUrl: raw,
          section: ad.section,
          package: {
            name: ad.purchasedPackage.package.name,
            duration: ad.purchasedPackage.package.duration,
            pricePerView: ad.purchasedPackage.package.getPricePerViewKWD ? ad.purchasedPackage.package.getPricePerViewKWD() : (ad.purchasedPackage.package.price_per_view_micro / 1_000_000),
            viewer_reward: ad.purchasedPackage.package.getViewerRewardKWD ? ad.purchasedPackage.package.getViewerRewardKWD() : ((ad.purchasedPackage.package.price_per_view_micro / 2) / 1_000_000)
          },
          advertiser: {
            name: ad.advertiser.name,
            companyName: ad.advertiser.company_name
          },
          cta_data: {
            enabled: ad.cta_enabled,
            link: ad.cta_link,
            text: ad.cta_text
          },
          is_watched: watchedIds.has(ad.id)
        });
        continue;
      }

      // Case 2: Legacy/local relative path → require local file existence
      const filename = raw ? path.basename(raw) : '';
      if (!filename) continue; // require a filename

      // Build a normalized local path under /uploads/ads
      const normalized = raw.startsWith('/uploads/ads/') ? raw : `/uploads/ads/${filename}`;

      // Ensure file exists on disk before emitting URL
      const filePath = path.resolve(__dirname, '..', 'uploads', 'ads', path.basename(normalized));
      if (!fs.existsSync(filePath)) {
        continue; // Skip ads with missing files to avoid 404s
      }

      // Absolutize for client consumption
      const mediaUrl = `${origin}${normalized}`;

      validAds.push({
        id: ad.id,
        title: ad.title,
        description: ad.description,
        mediaUrl,
        section: ad.section,
        package: {
          name: ad.purchasedPackage.package.name,
          duration: ad.purchasedPackage.package.duration,
          pricePerView: ad.purchasedPackage.package.getPricePerViewKWD ? ad.purchasedPackage.package.getPricePerViewKWD() : (ad.purchasedPackage.package.price_per_view_micro / 1_000_000),
          viewer_reward: ad.purchasedPackage.package.getViewerRewardKWD ? ad.purchasedPackage.package.getViewerRewardKWD() : ((ad.purchasedPackage.package.price_per_view_micro / 2) / 1_000_000)
        },
        advertiser: {
          name: ad.advertiser.name,
          companyName: ad.advertiser.company_name
        },
        // ✅ ADDED: CTA data for Instagram-style call-to-action buttons
        cta_data: {
          enabled: ad.cta_enabled,
          link: ad.cta_link,
          text: ad.cta_text
        },
        // New flag to indicate if this ad was already watched/rewarded by the viewer
        is_watched: watchedIds.has(ad.id)
      });
    }

    console.log(`🔍 getAllAds: Returning ${validAds.length} valid ads to frontend`);
    
    res.json({
      success: true,
      videos: validAds,
      pagination: {
        page,
        limit,
        total: validAds.length
      }
    });
  } catch (err) {
    console.error('❌ Failed to fetch all ads:', err);
    res.status(500).json({ 
      success: false,
      message: 'Failed to load videos',
      videos: []
    });
  }
};