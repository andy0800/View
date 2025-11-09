// backend/src/controllers/videoController.js
const { 
  User, 
  Wallet, 
  Transaction, 
  ViewEvent, 
  Ad, 
  AdvertiserPackage,
  PurchasedPackage,
  CompanyWallet,
  Section,
  sequelize 
} = require('../models');
const { Op } = require('sequelize');
const { fn, col } = require('sequelize');

/**
 * Helper function to filter out already watched videos for a specific user
 * FIXED: Now properly filters out watched videos and ensures they don't reappear
 */
async function filterAlreadyWatchedVideos(videos, userId) {
  if (!userId) return videos;

  try {
    const watchedVideoIds = await ViewEvent.findAll({
      where: {
        user_id: userId,
        is_completed: true
      },
      include: [{
        model: Ad,
        as: 'ad',
        where: {
          status: 'approved',
          is_active: true,
          verification_status: 'approved'
        },
        include: [{
          model: PurchasedPackage,
          as: 'purchasedPackage',
          where: {
            remaining_budget: { [Op.gt]: 0 }
            // ✅ REMOVED: status: 'active' - packages are marked 'used' after ad creation
          }
        }],
        attributes: []
      }],
      attributes: ['ad_id'],
      raw: true
    });

    const watchedIds = new Set(watchedVideoIds.map(event => event.ad_id));
    return videos.filter(video => !watchedIds.has(video.id));
  } catch (error) {
    console.error('Error filtering watched videos:', error);
    return videos; // Return all videos if filtering fails
  }
}

/**
 * Get all business sections with video counts
 */
async function getSections(req, res) {
  try {
    const sections = await Section.findAll({
      where: { is_active: true },
      order: [['sort_order', 'ASC'], ['title', 'ASC']]
    });

    const sectionsWithCounts = await Promise.all(
      sections.map(async (section) => {
        try {
          const totalVideos = await Ad.count({
            where: {
              section: section.key,
              status: 'approved',
              is_active: true,
              verification_status: 'approved'
            },
            include: [
              {
                model: PurchasedPackage,
                as: 'purchasedPackage',
                where: {
                  status: 'active'
                }
              }
            ]
          });

          // Get unwatched videos count for this user
          let unwatchedCount = totalVideos;
          if (req.user?.id) {
            const watchedVideoIds = await ViewEvent.findAll({
              where: {
                user_id: req.user.id,
                is_completed: true
              },
              include: [{
                model: Ad,
                as: 'ad',
                where: {
                  section: section.key,
                  status: 'approved',
                  is_active: true,
                  verification_status: 'approved'
                },
                include: [{
                  model: PurchasedPackage,
                  as: 'purchasedPackage',
                  where: {
                    remaining_budget: { [Op.gt]: 0 }
                    // ✅ REMOVED: status: 'active' - packages are marked 'used' after ad creation
                  }
                }],
                attributes: []
              }],
              attributes: ['ad_id'],
              raw: true
            });
            unwatchedCount = totalVideos - watchedVideoIds.length;
          }

          return {
            ...section.toJSON(),
            total_videos: totalVideos,
            unwatched_videos: Math.max(0, unwatchedCount)
          };
        } catch (error) {
          console.error(`Error getting count for section ${section.key}:`, error);
          return {
            ...section.toJSON(),
            total_videos: 0,
            unwatched_videos: 0
          };
        }
      })
    );

    res.json(sectionsWithCounts);
  } catch (error) {
    console.error('Error fetching sections:', error);
    res.status(500).json({ message: 'Failed to fetch sections' });
  }
}

/**
 * Get ads for a specific section
 */
async function getSectionAds(req, res) {
  try {
    const { sectionKey } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const userId = req.user?.id; // Get authenticated user ID

    const offset = (page - 1) * limit;

    // Verify section exists
    const section = await Section.findOne({
      where: { key: sectionKey, is_active: true }
    });

    if (!section) {
      return res.status(404).json({ message: 'Section not found' });
    }

    // Get active ads for this section using the new method
    const ads = await Ad.getActiveAdsBySection(sectionKey, { 
      limit: parseInt(limit), 
      offset: parseInt(offset),
      userId 
    });

    // Filter out already watched videos for this user
    const unwatchedAds = await filterAlreadyWatchedVideos(ads, userId);

    const total = await Ad.count({
      where: {
        section: sectionKey,
        status: 'approved',
        is_active: true,
        verification_status: 'approved'
      },
      include: [{
        model: PurchasedPackage,
        as: 'purchasedPackage',
        where: {
          remaining_budget: { [Op.gt]: 0 }
          // ✅ REMOVED: status: 'active' - packages are marked 'used' after ad creation
        },
        required: true
      }]
    });

    res.json({
      ads: unwatchedAds.map(ad => ({
        id: ad.id,
        title: ad.title,
        description: ad.description,
        mediaUrl: ad.mediaUrl,
        section: ad.section,
        package: {
          name: ad.package.name,
          duration: ad.package.duration,
          pricePerView: ad.package.getPricePerViewKWD()
        },
        advertiser: {
          name: ad.advertiser.name,
          companyName: ad.advertiser.company_name
        },
        remainingBudget: ad.purchasedPackage.getRemainingKWD(),
        estimatedViews: ad.purchasedPackage.estimated_views,
        viewsCompleted: ad.purchasedPackage.views_completed,
        // ✅ ADDED: CTA data for Instagram-style call-to-action buttons
        cta_data: {
          enabled: ad.cta_enabled,
          link: ad.cta_link,
          text: ad.cta_text
        }
      })),
      totalUnwatched: unwatchedAds.length,
      totalAvailable: ads.length,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching section ads:', error);
    res.status(500).json({ message: 'Failed to fetch ads' });
  }
}

/**
 * Start watching an ad (creates view event with proof token)
 */
async function startWatchingAd(req, res) {
  try {
    console.log('🎬 videoController.startWatchingAd called');
    const { adId } = req.params;
    const userId = req.user.id;
    console.log('📊 adId:', adId, 'userId:', userId);

    // Find the ad with package details
    console.log('🔍 Finding ad with package details...');
    const ad = await Ad.getAdWithPackageDetails(adId);
    if (!ad) {
      console.log('❌ Ad not found');
      return res.status(404).json({ message: 'Ad not found or not available' });
    }
    console.log('✅ Ad found:', ad.title);

    // Check if ad is available for viewing
    console.log('🔍 Checking if ad is available for viewing...');
    if (!ad.isAvailableForViewing()) {
      console.log('❌ Ad is not available for viewing');
      return res.status(400).json({ message: 'Ad is not available for viewing' });
    }
    console.log('✅ Ad is available for viewing');

    // Check if user already has an incomplete view for this ad
    console.log('🔍 Checking for existing view...');
    const existingView = await ViewEvent.findActiveByUserAndAd(userId, adId);
    if (existingView) {
      return res.json({
        success: true,
        message: 'View already in progress',
        viewEvent: {
          id: existingView.id,
          proofToken: existingView.proof_token,
          requiredDuration: existingView.required_duration_ms,
          expiresAt: existingView.proof_token_expires_at
        }
      });
    }

    // Generate proof token
    const crypto = require('crypto');
    const nonce = crypto.randomBytes(16).toString('hex');
    const startTs = Date.now();
    const proofToken = crypto
      .createHmac('sha256', process.env.PROOF_TOKEN_SECRET || 'default-secret')
      .update(`${adId}${userId}${nonce}${startTs}`)
      .digest('hex');

    // Calculate required duration in milliseconds
    // Default to at least 10s if package duration is missing
    const durationSec = Number(ad.getPackageDuration() || 10);
    const requiredDurationMs = Math.max(10000, durationSec * 1000);

    // Create view event
    // Ensure purchasedPackage association exists for FK
    if (!ad.purchased_package_id) {
      return res.status(400).json({ message: 'Ad has no purchased package' });
    }

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
    console.error('❌ Error starting ad view:', error);
    console.error('❌ Error stack:', error.stack);
    const isProd = (process.env.NODE_ENV || 'development') === 'production';
    res.status(500).json({ 
      message: 'Failed to start viewing ad',
      ...(isProd ? {} : { error: String(error && error.message || error), stack: error && error.stack })
    });
  }
}

/**
 * Complete watching an ad (processes reward and updates budget)
 */
async function completeWatchingAd(req, res) {
  try {
    console.log('🎯 completeWatchingAd called with params:', req.params);
    console.log('🎯 completeWatchingAd called with body:', req.body);
    
    const { adId } = req.params;
    const { proofToken, watchedDurationMs } = req.body;
    const userId = req.user.id;

    if (!adId || !proofToken) {
      console.error('❌ Missing required parameters:', { adId, proofToken });
      return res.status(400).json({ 
        message: 'Ad ID and proof token are required',
        details: { adId: !!adId, proofToken: !!proofToken }
      });
    }

    console.log('🔍 completeWatchingAd: Loading ad with package details for adId:', adId);
    
    // Load the ad with all necessary associations
    const ad = await Ad.getAdWithPackageDetails(adId);
    
    if (!ad) {
      console.log('❌ completeWatchingAd: Ad not found');
      return res.status(404).json({ message: 'Ad not found or not available' });
    }

    console.log('✅ completeWatchingAd: Ad loaded:', {
      id: ad.id,
      title: ad.title,
      package: ad.purchasedPackage?.package?.name,
      duration: ad.purchasedPackage?.package?.duration,
      pricePerView: ad.purchasedPackage?.package?.price_per_view_micro
    });

    // ✅ ENHANCED: Special debugging for P15 and P20 ads
    if (ad.purchasedPackage?.package?.duration === 15 || ad.purchasedPackage?.package?.duration === 20) {
      console.log('🚨 P15/P20 AD DETECTED - Enhanced debugging enabled');
      console.log('🔍 P15/P20 Ad details:', {
        id: ad.id,
        title: ad.title,
        packageName: ad.purchasedPackage?.package?.name,
        packageDuration: ad.purchasedPackage?.package?.duration,
        packagePrice: ad.purchasedPackage?.package?.price_per_view_micro,
        hasPurchasedPackage: !!ad.purchasedPackage,
        hasPackage: !!(ad.purchasedPackage && ad.purchasedPackage.package),
        budgetMicro: ad.purchasedPackage?.budget_micro,
        remainingMicro: ad.purchasedPackage?.remaining_micro,
        usedMicro: ad.purchasedPackage?.used_micro
      });
    }

    // Check if ad is available for viewing
    if (!ad.isAvailableForViewing()) {
      console.log('❌ completeWatchingAd: Ad is not available for viewing');
      return res.status(400).json({ message: 'Ad is not available for viewing' });
    }

    // Find the view event with the proof token
    const viewEvent = await ViewEvent.findOne({
      where: {
        ad_id: adId,
        user_id: userId,
        proof_token: proofToken,
        is_completed: false
      }
    });

    if (!viewEvent) {
      console.log('❌ completeWatchingAd: View event not found or already completed');
      return res.status(400).json({ message: 'View event not found or already completed' });
    }

    // Check if proof token has expired
    if (new Date() > viewEvent.proof_token_expires_at) {
      console.log('❌ completeWatchingAd: Proof token expired');
      return res.status(400).json({ message: 'Proof token has expired' });
    }

    // Enhanced fraud detection
    const fraudPatterns = await ViewEvent.detectFraudPatterns(userId, adId);

    if (fraudPatterns.multipleViewsSameAd) {
      console.log('🚨 completeWatchingAd: Multiple views of same ad detected');
      return res.status(400).json({ 
        message: 'Multiple views of the same ad detected',
        fraudDetected: true,
        reason: 'duplicate_view'
      });
    }

    if (fraudPatterns.rapidViews) {
      console.log('🚨 completeWatchingAd: Rapid successive views detected');
      return res.status(400).json({ 
        message: 'Rapid successive views detected',
        fraudDetected: true,
        reason: 'rapid_views'
      });
    }

    if (fraudPatterns.ipAnomaly) {
      console.log('🚨 completeWatchingAd: Suspicious IP activity detected');
      return res.status(400).json({ 
        message: 'Suspicious IP activity detected',
        fraudDetected: true,
        reason: 'ip_anomaly'
      });
    }

    if (fraudPatterns.uaAnomaly) {
      console.log('🚨 completeWatchingAd: Suspicious user agent activity detected');
      return res.status(400).json({ 
        message: 'Suspicious user agent activity detected',
        fraudDetected: true,
        reason: 'ua_anomaly'
      });
    }

    // Get or create viewer wallet
    let viewerWallet = await Wallet.findByUserId(userId);
    if (!viewerWallet) {
      viewerWallet = await Wallet.createForUser(userId);
    }

    // Calculate rewards using micro-units
    console.log('🔍 Debug ad structure:', {
      adId: ad.id,
      hasPurchasedPackage: !!ad.purchasedPackage,
      hasPackage: !!(ad.purchasedPackage && ad.purchasedPackage.package),
      purchasedPackageId: ad.purchasedPackage?.id,
      packageId: ad.purchasedPackage?.package?.id
    });
    
    const pricePerViewMicro = ad.getPackagePricePerViewMicro();
    
    if (!ad.purchasedPackage || !ad.purchasedPackage.package) {
      console.error('❌ Missing package association, attempting to reload...', {
        purchasedPackage: !!ad.purchasedPackage,
        package: !!(ad.purchasedPackage && ad.purchasedPackage.package)
      });
      
      // Try to reload the purchased package with the package association
      if (ad.purchasedPackage && !ad.purchasedPackage.package) {
        const { PurchasedPackage, AdvertiserPackage } = require('../models');
        const reloadedPackage = await PurchasedPackage.findByPk(ad.purchasedPackage.id, {
          include: [{
            model: AdvertiserPackage,
            as: 'package',
            required: true
          }]
        });
        
        if (reloadedPackage && reloadedPackage.package) {
          console.log('✅ Successfully reloaded package association');
          ad.purchasedPackage.package = reloadedPackage.package;
        } else {
          console.error('❌ Failed to reload package association');
          return res.status(500).json({ message: 'Ad package information not properly loaded' });
        }
      } else {
        return res.status(500).json({ message: 'Ad package information not properly loaded' });
      }
    }
    
    const viewerShareMicro = ad.purchasedPackage.package.getViewerRewardMicro();
    const companyShareMicro = ad.purchasedPackage.package.getCompanyShareMicro();

    // ✅ FIXED: Add debug logging to ensure proper types
    console.log('🔍 Debug - Package values:', {
      pricePerViewMicro: pricePerViewMicro,
      pricePerViewMicroType: typeof pricePerViewMicro,
      viewerShareMicro: viewerShareMicro,
      viewerShareMicroType: typeof viewerShareMicro,
      companyShareMicro: companyShareMicro,
      companyShareMicroType: typeof companyShareMicro
    });

    // ✅ ENHANCED: Special validation for P15 and P20 ads
    if (ad.purchasedPackage?.package?.duration === 15 || ad.purchasedPackage?.package?.duration === 20) {
      console.log('🔍 P15/P20 Ad validation:');
      console.log('  - Price per view:', pricePerViewMicro, 'micro units');
      console.log('  - Viewer share:', viewerShareMicro, 'micro units');
      console.log('  - Company share:', companyShareMicro, 'micro units');
      console.log('  - Budget remaining:', ad.purchasedPackage.remaining_micro, 'micro units');
      console.log('  - Can afford view:', ad.purchasedPackage.canAffordView());
      
      // Additional validation for P15/P20 ads
      if (pricePerViewMicro <= 0) {
        console.error('❌ P15/P20 Ad: Invalid price per view:', pricePerViewMicro);
        return res.status(500).json({ message: 'Invalid package pricing configuration' });
      }
      
      if (viewerShareMicro <= 0 || companyShareMicro <= 0) {
        console.error('❌ P15/P20 Ad: Invalid reward distribution:', { viewerShareMicro, companyShareMicro });
        return res.status(500).json({ message: 'Invalid reward distribution configuration' });
      }
    }

    // Start database transaction
    console.log('🔍 Starting database transaction...');
    const transaction = await sequelize.transaction();

    try {
      // Update view event
      console.log('🔍 Updating view event...');
      await viewEvent.update({
        is_completed: true,
        watched_duration_ms: watchedDurationMs,
        charged_micro: pricePerViewMicro,
        viewer_reward_micro: viewerShareMicro,
        company_share_micro: companyShareMicro,
        completed_at: new Date()
      }, { transaction });
      console.log('✅ View event updated successfully');

      // Deduct cost from purchased package with optimistic locking
      console.log('🔍 Deducting view cost from purchased package...');
      await ad.purchasedPackage.deductViewCost(pricePerViewMicro, transaction);
      console.log('✅ View cost deducted successfully');

      // Add reward to viewer wallet
      console.log('🔍 Adding reward to viewer wallet...');
      await viewerWallet.addBalance(viewerShareMicro, transaction);
      console.log('✅ Reward added to viewer wallet successfully');

      // Create transactions
      console.log('🔍 Creating view transaction...');
      await Transaction.createViewTransaction({
        fromWalletId: ad.purchasedPackage.id, // From purchased package
        toWalletId: viewerWallet.id, // To viewer wallet
        userId,
        amountMicro: pricePerViewMicro,
        adId,
        purchasedPackageId: ad.purchased_package_id,
        type: 'view_charge'
      }, transaction);
      console.log('✅ View transaction created successfully');

      console.log('🔍 Creating reward transaction...');
      await Transaction.createRewardTransaction({
        toWalletId: viewerWallet.id,
        userId,
        amountMicro: viewerShareMicro,
        adId,
        purchasedPackageId: ad.purchased_package_id
      }, transaction);
      console.log('✅ Reward transaction created successfully');

      // Create company fee transaction and update company wallet
      console.log('🔍 Getting company wallet...');
      const companyWallet = await CompanyWallet.getOrCreateMainWallet();
      console.log('✅ Company wallet retrieved');
      
      console.log('🔍 Adding company fee...');
      await companyWallet.addCompanyFee(companyShareMicro, transaction);
      console.log('✅ Company fee added');
      
      console.log('🔍 Recording viewer reward in company wallet...');
      await companyWallet.addViewerReward(viewerShareMicro, transaction);
      console.log('✅ Viewer reward recorded in company wallet');

      console.log('🔍 Creating company fee transaction...');
      await Transaction.createCompanyFeeTransaction({
        toWalletId: companyWallet.id,
        amountMicro: companyShareMicro,
        adId,
        purchasedPackageId: ad.purchased_package_id
      }, transaction);
      console.log('✅ Company fee transaction created');

      console.log('🔍 Committing transaction...');
      await transaction.commit();
      console.log('✅ Transaction committed successfully');

      // ✅ ENHANCED: Special success logging for P15/P20 ads
      if (ad.purchasedPackage?.package?.duration === 15 || ad.purchasedPackage?.package?.duration === 20) {
        console.log('🎉 P15/P20 AD SUCCESSFULLY COMPLETED!');
        console.log('📊 Final state:', {
          adId: ad.id,
          title: ad.title,
          package: ad.purchasedPackage.package.name,
          duration: ad.purchasedPackage.package.duration,
          pricePerView: pricePerViewMicro,
          viewerReward: viewerShareMicro,
          companyFee: companyShareMicro,
          newBudget: ad.purchasedPackage.remaining_micro,
          newBalance: viewerWallet.getBalanceKWD()
        });
      }

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
      console.error('❌ Error in completeWatchingAd transaction:', error);
      
      // ✅ ENHANCED: Special error handling for P15/P20 ads
      if (ad.purchasedPackage?.package?.duration === 15 || ad.purchasedPackage?.package?.duration === 20) {
        console.error('🚨 P15/P20 AD TRANSACTION FAILED!');
        console.error('🔍 Error details:', {
          error: error.message,
          stack: error.stack,
          adId: ad.id,
          package: ad.purchasedPackage?.package?.name,
          duration: ad.purchasedPackage?.package?.duration
        });
      }
      
      const isProd = (process.env.NODE_ENV || 'development') === 'production';
      res.status(500).json({ 
        message: 'Failed to complete view. Please try again.',
        ...(isProd ? {} : { error: String(error && error.message || error) })
      });
    }

  } catch (error) {
    console.error('❌ Error completing view:', error);
    res.status(500).json({ message: 'Failed to complete view' });
  }
}

/**
 * Get viewer's watch history
 */
async function getWatchHistory(req, res) {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const viewEvents = await ViewEvent.findAll({
      where: { 
        user_id: userId,
        is_completed: true
      },
      include: [
        {
          model: Ad,
          as: 'ad',
          attributes: ['title', 'mediaUrl']
        }
      ],
      order: [['completed_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    const total = await ViewEvent.count({
      where: { 
        user_id: userId,
        is_completed: true
      }
    });

    res.json({
      viewEvents,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching watch history:', error);
    res.status(500).json({ message: 'Failed to fetch watch history' });
  }
}

/**
 * Get all ads randomly for the "All Ads" tab
 */
async function getAllAdsRandomly(req, res) {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    const userId = req.user?.id; // Get authenticated user ID
    
    console.log(`🔍 getAllAdsRandomly called for user ${userId}, page ${page}, limit ${limit}`);

    // FIXED: Get all active ads with purchased package budget, ordered randomly
    const ads = await Ad.findAll({
      where: {
        status: 'active',
        is_active: true,
        verification_status: 'approved', // Only return verified ads
        purchased_package_id: { [Op.ne]: null } // Must have a purchased package
      },
      include: [
        {
          model: AdvertiserPackage,
          as: 'package',
          attributes: ['id', 'name', 'duration', 'price_per_view', 'viewer_reward', 'company_fee']
        },
        {
          model: User,
          as: 'advertiser',
          attributes: ['name', 'company_name']
        },
        {
          model: PurchasedPackage,
          as: 'purchasedPackage',
          attributes: ['id', 'remaining_budget', 'used_budget', 'status']
        }
      ],
      order: [[fn('RANDOM')]], // Random ordering
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    console.log(`🔍 Found ${ads.length} active ads before filtering`);

    // FIXED: Filter out ads with insufficient budget in purchased packages
    const adsWithBudget = ads.filter(ad => {
      if (!ad.purchased_package_id) return false;
      
      // Get the purchased package to check budget
      const purchasedPackage = ad.purchasedPackage;
      if (!purchasedPackage) return false;
      
      // Check if package has remaining budget
      const packagePricePerView = ad.package?.price_per_view || 0;
      // FIXED: price_per_view is already in KWD, no need to divide by 1000
      const pricePerViewKWD = packagePricePerView;
      const hasBudget = purchasedPackage.remaining_budget >= pricePerViewKWD;
      
      if (!hasBudget) {
        console.log(`⚠️ Ad ${ad.id} has insufficient budget: ${purchasedPackage.remaining_budget} KWD < ${pricePerViewKWD} KWD`);
      }
      
      return hasBudget;
    });

    console.log(`🔍 After budget filtering: ${adsWithBudget.length} ads with sufficient budget`);

    // Filter out already watched videos for this user
    const unwatchedAds = await filterAlreadyWatchedVideos(adsWithBudget, userId);

    console.log(`🔍 After filtering: ${unwatchedAds.length} unwatched ads`);

    // Helpers to normalize and absolutize media URLs
    const forwardedProto = req.headers['x-forwarded-proto'];
    const proto = (Array.isArray(forwardedProto) ? forwardedProto[0] : forwardedProto) || req.protocol || 'https';
    const origin = (process.env.BACKEND_PUBLIC_URL?.trim()) || `${proto}://${req.get('host')}`;
    const normalize = url => {
      if (!url) return url;
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
      return filename ? `/uploads/ads/${filename}` : u;
    };
    const absolutize = url => {
      if (!url) return url;
      const n = normalize(url);
      return /^https?:\/\//i.test(n) ? n : `${origin}${n}`;
    };

    // Add CTA data and absolute media URL to each ad
    const adsWithCTA = unwatchedAds.map(ad => ({
      ...ad.toJSON(),
      mediaUrl: absolutize(ad.mediaUrl),
      cta_data: {
        link: ad.cta_link,
        text: ad.cta_text,
        enabled: ad.cta_enabled
      }
    }));

    const total = await Ad.count({
      where: {
        status: 'active',
        is_active: true,
        verification_status: 'approved', // Only count verified ads
        remaining_budget: { [Op.gt]: 0 }
      }
    });

    res.json({
      success: true,
      videos: adsWithCTA,
      totalUnwatched: adsWithCTA.length,
      totalAvailable: ads.length,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('❌ Error fetching all ads randomly:', error);
    res.status(500).json({ message: 'Failed to fetch ads' });
  }
}

// Get videos by business section
async function getVideosBySection(req, res) {
  try {
    const { sectionKey } = req.params;
    const userId = req.user?.id; // Get authenticated user ID
    
    console.log(`🔍 getVideosBySection called for section ${sectionKey}, user ${userId}`);
    
    // FIXED: Find ads that belong to this business section with purchased package budget
    const videos = await Ad.findAll({
      where: {
        section: sectionKey,
        status: 'active', // Ad must be active
        is_active: true,
        verification_status: 'approved', // Ad must be verified and approved
        purchased_package_id: { [Op.ne]: null } // Must have a purchased package
      },
      include: [
        {
          model: User,
          as: 'advertiser',
          attributes: ['id', 'name', 'company_name']
        },
        {
          model: AdvertiserPackage,
          as: 'package',
          attributes: ['id', 'name', 'duration', 'price_per_view', 'viewer_reward', 'company_fee']
        },
        {
          model: PurchasedPackage,
          as: 'purchasedPackage',
          attributes: ['id', 'remaining_budget', 'used_budget', 'status']
        }
      ],
      order: [['created_at', 'DESC']]
    });

    console.log(`🔍 Found ${videos.length} videos in section ${sectionKey} before filtering`);

    // FIXED: Filter out videos with insufficient budget in purchased packages
    const videosWithBudget = videos.filter(video => {
      if (!video.purchased_package_id) return false;
      
      // Get the purchased package to check budget
      const purchasedPackage = video.purchasedPackage;
      if (!purchasedPackage) return false;
      
      // Check if package has remaining budget
      const packagePricePerView = video.package?.price_per_view || 0;
      // FIXED: price_per_view is already in KWD, no need to divide by 1000
      const pricePerViewKWD = packagePricePerView;
      const hasBudget = purchasedPackage.remaining_budget >= pricePerViewKWD;
      
      if (!hasBudget) {
        console.log(`⚠️ Video ${video.id} has insufficient budget: ${purchasedPackage.remaining_budget} KWD < ${pricePerViewKWD} KWD`);
      }
      
      return hasBudget;
    });

    console.log(`🔍 After budget filtering: ${videosWithBudget.length} videos with sufficient budget`);

    // Filter out already watched videos for this user
    const unwatchedVideos = await filterAlreadyWatchedVideos(videosWithBudget, userId);

    console.log(`🔍 After filtering: ${unwatchedVideos.length} unwatched videos in section ${sectionKey}`);

    // Helpers to normalize and absolutize media URLs
    const origin = (process.env.BACKEND_PUBLIC_URL?.trim()) || `${req.protocol}://${req.get('host')}`;
    const normalize = url => {
      if (!url) return url;
      const u = String(url);
      if (/^https?:\/\//i.test(u)) return u; // already absolute
      if (u.startsWith('/uploads/')) return u;
      // Map legacy paths or bare filenames to /uploads
      const parts = u.split('/');
      const filename = parts[parts.length - 1];
      return `/uploads/${filename}`;
    };
    const absolutize = url => {
      if (!url) return url;
      const n = normalize(url);
      return /^https?:\/\//i.test(n) ? n : `${origin}${n}`;
    };

    // Add CTA data and absolute media URL to each video
    const videosWithCTA = unwatchedVideos.map(video => ({
      ...video.toJSON(),
      mediaUrl: absolutize(video.mediaUrl),
      cta_data: {
        link: video.cta_link,
        text: video.cta_text,
        enabled: video.cta_enabled
      }
    }));

    // Get section info
    const sectionInfo = {
      key: sectionKey,
      title: sectionKey.charAt(0).toUpperCase() + sectionKey.slice(1),
      videoCount: videosWithCTA.length,
      totalAvailable: videos.length
    };

    res.json({
      success: true,
      videos: videosWithCTA,
      sectionInfo: sectionInfo,
      pagination: {
        total: videosWithCTA.length,
        totalAvailable: videos.length,
        page: 1,
        pages: 1,
        limit: videosWithCTA.length
      }
    });
  } catch (error) {
    console.error('❌ Error fetching videos by section:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch videos for this section'
    });
  }
}

module.exports = {
  getSections,
  getSectionAds,
  getAllAdsRandomly,
  startWatchingAd,
  completeWatchingAd,
  getWatchHistory,
  getVideosBySection
};