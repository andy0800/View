// backend/src/controllers/advertiserController.js
const { 
  AdvertiserPackage, 
  PurchasedPackage, 
  Wallet, 
  Transaction, 
  Ad,
  sequelize 
} = require('../models');
const { uploadToS3 } = require('../utils/upload');

const { 
  validateBudget, 
  calculateViewsPurchased, 
  kwdToMicro,
  getPackageById 
} = require('../constants/advertiser');

const { 
  unifyPackageData, 
  unifyPurchasedPackageData, 
  unifyAdData 
} = require('../utils/currencyUnifier');
const { ViewEvent } = require('../models');

// Get available packages
async function getPackages(req, res) {
  try {
    console.log('🔄 Fetching packages from database...');
    console.log('👤 User making request:', req.user ? {
      id: req.user.id,
      role: req.user.role,
      kyc_status: req.user.kyc_status
    } : 'No user found');
    
    const packages = await AdvertiserPackage.getActivePackages();
    console.log('📦 Raw packages from DB:', packages.length, 'packages found');
    console.log('📦 Raw packages data:', packages.map(p => ({
      id: p.id,
      name: p.name,
      is_active: p.is_active,
      price_per_view_micro: p.price_per_view_micro
    })));
    
    // Transform packages using currency unification utility
    const transformedPackages = packages.map(pkg => unifyPackageData(pkg));
    console.log('📦 Transformed packages:', transformedPackages.length, 'packages after transformation');
    console.log('📦 Transformed packages data:', transformedPackages.map(p => ({
      id: p.id,
      name: p.name,
      pricePerView: p.pricePerView,
      pricePerViewMicro: p.pricePerViewMicro
    })));
    
    // Debug log to see what we're sending
    console.log('📦 Sending packages to frontend:', transformedPackages.map(p => ({
      name: p.name,
      pricePerView: p.pricePerView,
      price_per_view: p.price_per_view,
      pricePerViewMicro: p.pricePerViewMicro,
      price_per_view_micro: p.price_per_view_micro
    })));
    
    console.log('📦 Final response structure:', {
      isArray: Array.isArray(transformedPackages),
      length: transformedPackages.length,
      type: typeof transformedPackages,
      firstItem: transformedPackages[0]
    });

    res.json(transformedPackages);
  } catch (error) {
    console.error('❌ Error fetching packages:', error);
    res.status(500).json({ message: 'Failed to fetch packages' });
  }
}

// Enhanced package purchase with robust budget validation and micro-unit system
async function purchasePackage(req, res) {
  try {
    // Prevent admin users from accessing advertiser endpoints
    if (req.user.id === '00000000-0000-0000-0000-000000000000' || req.user.role === 'admin') {
      return res.status(403).json({ 
        message: 'Admin users cannot access advertiser endpoints' 
      });
    }
    
    const { packageId, budget } = req.body;
    const advertiserId = req.user.id;

    if (!packageId || !budget) {
      return res.status(400).json({ 
        message: 'Package ID and budget are required' 
      });
    }

    // Enhanced budget validation using new micro-unit system
    const budgetValidation = validateBudget(budget);
    if (!budgetValidation.isValid) {
      return res.status(400).json({ 
        message: budgetValidation.error,
        details: {
          minBudget: 300,
          increment: 100,
          providedBudget: budget,
          validBudgets: [300, 400, 500, 600, 700, 800, 900, 1000]
        }
      });
    }

    // Find the package from database
    const package = await AdvertiserPackage.findByPk(packageId);
    
    if (!package || !package.is_active) {
      return res.status(404).json({ 
        message: 'Package not found or inactive' 
      });
    }

    // Check advertiser wallet balance
    const wallet = await Wallet.findByUserId(advertiserId);
    if (!wallet) {
      return res.status(400).json({ 
        message: 'Wallet not found for advertiser' 
      });
    }

    const budgetMicro = budgetValidation.budgetMicro;
    if (wallet.getAvailableBalanceMicro() < budgetMicro) {
      return res.status(400).json({ 
        message: `Insufficient wallet balance. Required: ${budgetValidation.budgetKWD} KWD, Available: ${wallet.getAvailableBalanceKWD()} KWD` 
      });
    }

    // Calculate estimated views based on package price per view and chosen budget
    const estimatedViews = calculateViewsPurchased(budgetMicro, parseInt(package.price_per_view_micro));

    // Start database transaction to ensure data consistency
    const transaction = await sequelize.transaction();

    try {
      // Deduct budget from advertiser's wallet immediately
      await wallet.deductBalance(budgetMicro, transaction);

      // Create transaction record for the purchase
      await Transaction.createPackagePurchaseTransaction({
        fromWalletId: wallet.id,
        userId: advertiserId,
        amountMicro: budgetMicro,
        packageId: packageId,
        estimatedViews
      }, transaction);

      // ✅ FIXED: Create PurchasedPackage record without user_id (doesn't exist in database)
      const purchasedPackage = await PurchasedPackage.create({
        advertiser_id: advertiserId, // Only advertiser_id field exists in database
        package_id: packageId,
        // Micro unit values for precise calculations
        budget_micro: budgetMicro,
        remaining_micro: budgetMicro,
        estimated_views: estimatedViews,
        views_completed: 0,
        status: 'active',
        expires_at: null, // No expiration for now
      }, { transaction });

      await transaction.commit();

      res.json({
        success: true,
        message: 'Package purchased successfully',
        purchasedPackage: {
          id: purchasedPackage.id,
          packageName: package.name,
          budget: budgetValidation.budgetKWD,
          budgetMicro: budgetMicro,
          estimatedViews,
          remainingBudget: budgetValidation.budgetKWD,
          remainingMicro: budgetMicro,
          status: 'active'
        }
      });

    } catch (error) {
      await transaction.rollback();
      console.error('Error in purchasePackage transaction:', error);
      res.status(500).json({ 
        message: 'Failed to purchase package. Please try again.' 
      });
    }
  } catch (error) {
    console.error('Error in purchasePackage:', error);
    res.status(500).json({ 
      message: 'Server error while processing purchase' 
    });
  }
}

// Get purchased packages for advertiser
async function getPurchasedPackages(req, res) {
  try {
    // Prevent admin users from accessing advertiser endpoints
    if (req.user.id === '00000000-0000-0000-0000-000000000000' || req.user.role === 'admin') {
      return res.status(403).json({ 
        message: 'Admin users cannot access advertiser endpoints' 
      });
    }
    
    const advertiserId = req.user.id;
    
    const purchasedPackages = await PurchasedPackage.getActiveByAdvertiser(advertiserId);
    
    // Transform packages to include KWD values for frontend
    const transformedPackages = purchasedPackages.map(pkg => {
      // Ensure we have valid numeric values for frontend
      const budgetKWD = parseFloat(pkg.purchased_budget) || (pkg.budget_micro / 1_000_000) || 0;
      const remainingKWD = parseFloat(pkg.remaining_budget) || (pkg.remaining_micro / 1_000_000) || 0;
      const usedKWD = parseFloat(pkg.used_budget) || (pkg.used_micro / 1_000_000) || 0;
      
      return {
        id: pkg.id,
        package: {
          id: pkg.package?.id || pkg.package_id,
          name: pkg.package?.name || 'Unknown Package',
          duration: pkg.package?.duration || 0,
          price_per_view: pkg.package?.price_per_view || (pkg.package?.price_per_view_micro / 1_000_000) || 0,
          pricePerView: pkg.package?.getPricePerViewKWD ? pkg.package.getPricePerViewKWD() : (pkg.package?.price_per_view_micro / 1_000_000) || 0,
          price_per_view_micro: pkg.package?.price_per_view_micro || 0,
          pricePerViewMicro: pkg.package?.price_per_view_micro || 0
        },
        purchased_budget: budgetKWD,
        remaining_budget: remainingKWD,
        used_budget: usedKWD,
        estimated_views: pkg.estimated_views || 0,
        views_completed: pkg.views_completed || 0,
        utilizationPercentage: pkg.getUtilizationPercentage ? pkg.getUtilizationPercentage() : 0,
        status: pkg.status || 'active',
        createdAt: pkg.created_at || pkg.purchased_at,
        expiresAt: pkg.expires_at
      };
    });

    res.json({
      success: true,
      purchasedPackages: transformedPackages
    });
  } catch (error) {
    console.error('Error fetching purchased packages:', error);
    res.status(500).json({ message: 'Failed to fetch purchased packages' });
  }
}

// Create new ad
async function createAd(req, res) {
  try {
    // Prevent admin users from accessing advertiser endpoints
    if (req.user.id === '00000000-0000-0000-0000-000000000000' || req.user.role === 'admin') {
      return res.status(403).json({ 
        message: 'Admin users cannot access advertiser endpoints' 
      });
    }
    
    const { title, description, section, packageId, purchasedPackageId, cta_link, cta_text, cta_enabled } = req.body;
    const advertiserId = req.user.id;

    if (!title || !description || !section || !purchasedPackageId) {
      return res.status(400).json({ 
        message: 'Title, description, section, and purchased package ID are required' 
      });
    }

    // Verify the purchased package belongs to this advertiser and is active (not used)
    const purchasedPackage = await PurchasedPackage.findOne({
      where: {
        id: purchasedPackageId,
        advertiser_id: advertiserId,
        status: 'active' // Only active packages can be used for creating ads
      },
      include: [{
        model: AdvertiserPackage,
        as: 'package'
      }]
    });

    if (!purchasedPackage) {
      return res.status(400).json({ 
        message: 'Purchased package not found, inactive, or already used. Each package can only be used once to create one ad.' 
      });
    }

    // Check if this package was already used to create an ad
    const existingAd = await Ad.findOne({
      where: {
        purchased_package_id: purchasedPackageId,
        advertiserId
      }
    });

    if (existingAd) {
      return res.status(400).json({ 
        message: 'This package has already been used to create an ad. Each package can only be used once.' 
      });
    }

    // Check if advertiser has enough budget
    if (!purchasedPackage.canAffordView()) {
      return res.status(400).json({ 
        message: 'Insufficient budget in purchased package' 
      });
    }

    // Persist media using upload helper (writes to backend/src/uploads/ads)
    let mediaUrl = null;
    if (req.file && req.file.buffer) {
      mediaUrl = await uploadToS3(req.file.buffer, req.file.originalname || 'ad.mp4', 'ads');
    }
    if (!mediaUrl) {
      return res.status(400).json({ 
        message: 'Media file is required' 
      });
    }

    // Start database transaction for atomic operation
    const transaction = await sequelize.transaction();

    try {
      // Create the ad
      const ad = await Ad.create({
        advertiserId,
        packageId: purchasedPackage.package_id,
        purchased_package_id: purchasedPackageId,
        mediaUrl,
        title,
        description,
        section,
        cta_link: cta_link || null,
        cta_text: cta_text || 'Learn More',
        cta_enabled: cta_enabled !== undefined ? cta_enabled : true,
        status: 'pending_review',
        is_active: true,
        verification_status: 'pending',
        submitted_for_review_at: new Date(),
        review_deadline: new Date(Date.now() + 24 * 60 * 60 * 1000)
      }, { transaction });

      // ✅ CRITICAL FIX: Mark purchased package as 'used' - ONE TIME USAGE ONLY
      await purchasedPackage.update({
        status: 'used'
      }, { transaction });

      await transaction.commit();

      res.json({
        success: true,
        message: 'Ad created successfully and submitted for review. Package is now used and cannot be reused.',
        ad: {
          id: ad.id,
          title: ad.title,
          status: ad.status,
          verificationStatus: ad.verification_status
        },
        packageActive: false, // Package is now used
        remainingBudget: purchasedPackage.getRemainingKWD()
      });

    } catch (error) {
      await transaction.rollback();
      throw error;
    }

  } catch (error) {
    console.error('Error creating ad:', error);
    res.status(500).json({ message: 'Failed to create ad' });
  }
}

// Get advertiser's ads
async function getAds(req, res) {
  try {
    // Prevent admin users from accessing advertiser endpoints
    if (req.user.id === '00000000-0000-0000-0000-000000000000' || req.user.role === 'admin') {
      return res.status(403).json({ 
        message: 'Admin users cannot access advertiser endpoints' 
      });
    }
    
    const advertiserId = req.user.id;
    
    const ads = await Ad.findAll({
      where: { advertiserId },
      include: [
        {
          model: PurchasedPackage,
          as: 'purchasedPackage',
          include: [{
            model: AdvertiserPackage,
            as: 'package'
          }]
        }
      ],
      order: [['created_at', 'DESC']]
    });

    // Transform ads for frontend with complete data
    const transformedAds = ads.map(ad => ({
      id: ad.id,
      title: ad.title,
      description: ad.description,
      mediaUrl: ad.mediaUrl,
      section: ad.section,
      status: ad.status,
      verification_status: ad.verification_status,
      verificationStatus: ad.verification_status,
      isActive: ad.is_active,
      createdAt: ad.created_at,
      package: {
        name: ad.purchasedPackage.package.name,
        duration: ad.purchasedPackage.package.duration,
        pricePerView: ad.purchasedPackage.package.getPricePerViewKWD ? ad.purchasedPackage.package.getPricePerViewKWD() : (ad.purchasedPackage.package.price_per_view_micro / 1_000_000)
      },
      budget: ad.purchasedPackage.getBudgetKWD ? ad.purchasedPackage.getBudgetKWD() : parseFloat(ad.purchasedPackage.purchased_budget || 0),
      remainingBudget: ad.purchasedPackage.getRemainingKWD ? ad.purchasedPackage.getRemainingKWD() : parseFloat(ad.purchasedPackage.remaining_budget || 0),
      usedBudget: ad.purchasedPackage.getUsedKWD ? ad.purchasedPackage.getUsedKWD() : parseFloat(ad.purchasedPackage.used_budget || 0),
      estimatedViews: ad.purchasedPackage.estimated_views,
      viewsCompleted: ad.purchasedPackage.views_completed,
      // Legacy fields for compatibility
      spent: ad.purchasedPackage.getUsedKWD ? ad.purchasedPackage.getUsedKWD() : parseFloat(ad.purchasedPackage.used_budget || 0),
      views: ad.purchasedPackage.views_completed
    }));

    res.json({
      success: true,
      ads: transformedAds
    });
  } catch (error) {
    console.error('Error fetching ads:', error);
    res.status(500).json({ message: 'Failed to fetch ads' });
  }
}

// Get ad statistics
async function getAdStats(req, res) {
  try {
    // Prevent admin users from accessing advertiser endpoints
    if (req.user.id === '00000000-0000-0000-0000-000000000000' || req.user.role === 'admin') {
      return res.status(403).json({ 
        message: 'Admin users cannot access advertiser endpoints' 
      });
    }
    
    const { adId } = req.params;
    const advertiserId = req.user.id;

    const ad = await Ad.getAdWithPackageDetails(adId);
    if (!ad || ad.advertiserId !== advertiserId) {
      return res.status(404).json({ message: 'Ad not found' });
    }

    // Build stats with proper null safety and data access
    const packageData = ad.purchasedPackage?.package;
    
    const stats = {
      basic: {
        adId: ad.id,
        title: ad.title,
        status: ad.status,
        verificationStatus: ad.verification_status,
        budget: ad.purchasedPackage?.getBudgetKWD() || 0,
        remainingBudget: ad.purchasedPackage?.getRemainingKWD() || 0,
        usedBudget: ad.purchasedPackage?.getUsedKWD() || 0
      },
      performance: {
        estimatedViews: ad.purchasedPackage?.estimated_views || 0,
        viewsCompleted: ad.purchasedPackage?.views_completed || 0,
        completedViews: ad.purchasedPackage?.views_completed || 0,
        utilizationPercentage: ad.purchasedPackage?.getUtilizationPercentage() || 0,
        budgetUtilization: ad.purchasedPackage?.getUtilizationPercentage() || 0,
        costPerView: packageData?.getPricePerViewKWD ? packageData.getPricePerViewKWD() : (packageData?.price_per_view_micro / 1_000_000) || 0,
        averageViewDuration: packageData?.duration || 0,
        conversionRate: 0 // Placeholder for future enhancement
      },
      roi: {
        totalSpent: ad.purchasedPackage?.getUsedKWD() || 0,
        costEfficiency: 0, // Placeholder for future enhancement
        viewValue: 0 // Placeholder for future enhancement
      },
      package: packageData ? {
        name: packageData.name,
        duration: packageData.duration,
        pricePerView: packageData.getPricePerViewKWD ? packageData.getPricePerViewKWD() : (packageData.price_per_view_micro / 1_000_000),
        price_per_view: packageData.getPricePerViewKWD ? packageData.getPricePerViewKWD() * 1000 : (packageData.price_per_view_micro / 1_000) // in fils
      } : {
        name: 'Unknown Package',
        duration: 0,
        pricePerView: 0,
        price_per_view: 0
      }
    };

    // Debug logging to help identify data structure issues
    console.log('📊 Ad Stats Debug:', {
      adId,
      hasAd: !!ad,
      hasPurchasedPackage: !!ad?.purchasedPackage,
      hasPackage: !!ad?.purchasedPackage?.package,
      packageName: ad?.purchasedPackage?.package?.name,
      packageDuration: ad?.purchasedPackage?.package?.duration,
      packagePricePerView: ad?.purchasedPackage?.package?.price_per_view_micro,
      statsPackage: stats.package
    });

    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Error fetching ad stats:', error);
    res.status(500).json({ message: 'Failed to fetch ad statistics' });
  }
}

// Toggle ad status
async function toggleAdStatus(req, res) {
  try {
    // Prevent admin users from accessing advertiser endpoints
    if (req.user.id === '00000000-0000-0000-0000-000000000000' || req.user.role === 'admin') {
      return res.status(403).json({ 
        message: 'Admin users cannot access advertiser endpoints' 
      });
    }
    
    const { adId } = req.params;
    const { status } = req.body;
    const advertiserId = req.user.id;

    const ad = await Ad.findOne({
      where: { id: adId, advertiserId }
    });

    if (!ad) {
      return res.status(404).json({ message: 'Ad not found' });
    }

    // Validate status transition
    const validTransitions = {
      'draft': ['pending_review'],
      'pending_review': ['draft'],
      'approved': ['active', 'paused'],
      'active': ['paused'],
      'paused': ['active']
    };

    if (!validTransitions[ad.status] || !validTransitions[ad.status].includes(status)) {
      return res.status(400).json({ 
        message: `Cannot transition from ${ad.status} to ${status}` 
      });
    }

    await ad.update({ status });
    
    res.json({
      success: true,
      message: `Ad status updated to ${status}`,
      ad: { id: ad.id, status: ad.status }
    });
  } catch (error) {
    console.error('Error toggling ad status:', error);
    res.status(500).json({ message: 'Failed to update ad status' });
  }
}

// Get dashboard statistics
async function getDashboardStats(req, res) {
  try {
    // Prevent admin users from accessing advertiser endpoints
    if (req.user.id === '00000000-0000-0000-0000-000000000000' || req.user.role === 'admin') {
      return res.status(403).json({ 
        message: 'Admin users cannot access advertiser endpoints' 
      });
    }
    
    const advertiserId = req.user.id;

    const [purchasedPackages, ads] = await Promise.all([
      PurchasedPackage.getActiveByAdvertiser(advertiserId),
      Ad.findAll({
        where: { advertiserId },
        include: [{
          model: PurchasedPackage,
          as: 'purchasedPackage'
        }]
      })
    ]);

    // Unify data using currency unification utility
    const unifiedPackages = purchasedPackages.map(pkg => unifyPurchasedPackageData(pkg));
    const unifiedAds = ads.map(ad => unifyAdData(ad));

    const totalBudget = unifiedPackages.reduce((sum, pkg) => sum + (pkg.purchasedBudget || 0), 0);
    const totalUsed = unifiedPackages.reduce((sum, pkg) => sum + (pkg.usedBudget || 0), 0);
    const totalRemaining = unifiedPackages.reduce((sum, pkg) => sum + (pkg.remainingBudget || 0), 0);
    const totalViews = unifiedPackages.reduce((sum, pkg) => sum + (pkg.views_completed || 0), 0);
    const totalEstimatedViews = unifiedPackages.reduce((sum, pkg) => sum + (pkg.estimated_views || 0), 0);

    const stats = {
      totalBudget,
      totalUsed,
      totalRemaining,
      totalViews,
      totalEstimatedViews,
      activePackages: unifiedPackages.filter(pkg => pkg.status === 'active').length,
      totalPackages: unifiedPackages.length,
      activeAds: unifiedAds.filter(ad => ad.status === 'approved' && ad.isActive).length,
      totalAds: unifiedAds.length,
      averageCostPerView: totalViews > 0 ? totalUsed / totalViews : 0,
      budgetUtilization: totalBudget > 0 ? (totalUsed / totalBudget) * 100 : 0
    };

    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ message: 'Failed to fetch dashboard statistics' });
  }
}

// Update advertiser profile
async function updateProfile(req, res) {
  try {
    // Prevent admin users from accessing advertiser endpoints
    if (req.user.id === '00000000-0000-0000-0000-000000000000' || req.user.role === 'admin') {
      return res.status(403).json({ 
        message: 'Admin users cannot access advertiser endpoints' 
      });
    }
    
    const { name, phone, company_name, license_number, signatory_name } = req.body;
    const advertiserId = req.user.id;
    
    // Validate required fields
    if (!name || !phone || !company_name || !license_number || !signatory_name) {
      return res.status(400).json({ 
        message: 'All profile fields are required' 
      });
    }
    
    // Find and update user
    const user = await sequelize.models.User.findByPk(advertiserId);
    if (!user || user.role !== 'advertiser') {
      return res.status(404).json({ message: 'Advertiser not found' });
    }
    
    // Update profile fields
    await user.update({
      name,
      phone,
      company_name,
      license_number,
      signatory_name
    });
    
    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        company_name: user.company_name,
        license_number: user.license_number,
        signatory_name: user.signatory_name,
        role: user.role,
        kyc_status: user.kyc_status
      }
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ message: 'Failed to update profile' });
  }
}

// Enhanced ad statistics with detailed metrics (single implementation)
async function getAdStatsEnhanced(req, res) {
  try {
    // Prevent admin users from accessing advertiser endpoints
    if (req.user.id === '00000000-0000-0000-0000-000000000000' || req.user.role === 'admin') {
      return res.status(403).json({ 
        message: 'Admin users cannot access advertiser endpoints' 
      });
    }
    
    const { adId } = req.params;
    const advertiserId = req.user.id;
    
    // Find ad with related data using proper associations
    const ad = await Ad.findOne({
      where: { id: adId, advertiserId: advertiserId },
      include: [
        { 
          model: PurchasedPackage, 
          as: 'purchasedPackage',
          include: [{
            model: AdvertiserPackage,
            as: 'package'
          }]
        },
        { 
          model: ViewEvent, 
          as: 'viewEvents',
          where: { is_completed: true },
          required: false
        }
      ]
    });
    
    if (!ad) {
      return res.status(404).json({ message: 'Ad not found' });
    }
    
    // Calculate comprehensive statistics from actual data
    const totalViews = ad.purchasedPackage?.views_completed || 0;
    const totalSpent = ad.purchasedPackage?.getUsedKWD ? ad.purchasedPackage.getUsedKWD() : parseFloat(ad.purchasedPackage?.used_budget || 0);
    const remainingBudget = ad.purchasedPackage?.getRemainingKWD ? ad.purchasedPackage.getRemainingKWD() : parseFloat(ad.purchasedPackage?.remaining_budget || 0);
    const totalBudget = ad.purchasedPackage?.getBudgetKWD ? ad.purchasedPackage.getBudgetKWD() : parseFloat(ad.purchasedPackage?.purchased_budget || 0);
    
    // Calculate view completion metrics from view events
    const completedViews = ad.viewEvents?.length || 0;
    const averageViewDuration = ad.viewEvents?.length > 0 
      ? ad.viewEvents.reduce((sum, event) => sum + (event.completion_duration || 0), 0) / ad.viewEvents.length
      : 0;
    
    // Calculate conversion and cost metrics
    const conversionRate = totalViews > 0 ? (completedViews / totalViews) * 100 : 0;
    const pricePerView = ad.purchasedPackage?.package?.getPricePerViewKWD ? ad.purchasedPackage.package.getPricePerViewKWD() : 0;
    const costPerView = pricePerView;
    const budgetUtilization = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
    
    // Calculate ROI metrics
    const estimatedViews = ad.purchasedPackage?.estimated_views || 0;
    const viewsEfficiency = estimatedViews > 0 ? (totalViews / estimatedViews) * 100 : 0;
    
    const stats = {
      basic: {
        totalViews,
        totalSpent,
        remainingBudget,
        totalBudget,
        status: ad.status,
        isActive: ad.is_active
      },
      performance: {
        completedViews,
        averageViewDuration: Math.round(averageViewDuration * 100) / 100,
        conversionRate: Math.round(conversionRate * 100) / 100,
        costPerView: Math.round(costPerView * 1000) / 1000,
        budgetUtilization: Math.round(budgetUtilization * 100) / 100
      },
      roi: {
        estimatedViews,
        viewsEfficiency: Math.round(viewsEfficiency * 100) / 100,
        costEfficiency: estimatedViews > 0 ? (totalSpent / estimatedViews) : 0
      },
      package: ad.purchasedPackage?.package ? {
        // Package details
        name: ad.purchasedPackage.package.name,
        duration: ad.purchasedPackage.package.duration,
        pricePerView: ad.purchasedPackage.package.getPricePerViewKWD ? ad.purchasedPackage.package.getPricePerViewKWD() : (ad.purchasedPackage.package.price_per_view_micro / 1_000_000),
        price_per_view: ad.purchasedPackage.package.getPricePerViewKWD ? ad.purchasedPackage.package.getPricePerViewKWD() * 1000 : (ad.purchasedPackage.package.price_per_view_micro / 1_000), // in fils
        // Budget details
        id: ad.purchasedPackage.id,
        purchasedBudget: totalBudget,
        estimatedViews: ad.purchasedPackage.estimated_views,
        remainingBudget: remainingBudget,
        usedBudget: totalSpent
      } : {
        name: 'Unknown Package',
        duration: 0,
        pricePerView: 0,
        price_per_view: 0,
        id: null,
        purchasedBudget: 0,
        estimatedViews: 0,
        remainingBudget: 0,
        usedBudget: 0
      }
    };
    
    res.json({
      success: true,
      stats,
      ad: {
        id: ad.id,
        title: ad.title,
        status: ad.status,
        verification_status: ad.verification_status,
        isActive: ad.is_active,
        createdAt: ad.created_at
      }
    });
  } catch (error) {
    console.error('Error fetching enhanced ad stats:', error);
    res.status(500).json({ message: 'Failed to fetch ad statistics' });
  }
}

module.exports = {
  getPackages,
  purchasePackage,
  getPurchasedPackages,
  createAd,
  getAds,
  getAdStats: getAdStatsEnhanced, // Use the enhanced version
  toggleAdStatus,
  getDashboardStats,
  updateProfile
};