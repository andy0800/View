# 📦 **ADS PACKAGE SYSTEM - COMPREHENSIVE ANALYSIS**

## 🎯 **OVERVIEW**

This document provides a complete analysis of the **Ads Package System** across the entire application, including all direct and indirect connections, wirings, and relationships between frontend, backend, and database components.

---

## 🗄️ **DATABASE LAYER**

### **1. Core Package Tables**

#### **`advertiser_packages` Table**
```sql
CREATE TABLE advertiser_packages (
  id INTEGER PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  duration INTEGER NOT NULL, -- Duration in seconds
  price_per_view_micro BIGINT NOT NULL, -- Price in micro units (1,000,000 = 1 KWD)
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Key Fields:**
- `duration`: Video duration in seconds (10, 15, 20, 30)
- `price_per_view_micro`: Cost per view in micro units
- `is_active`: Package availability status

#### **`purchased_packages` Table**
```sql
CREATE TABLE purchased_packages (
  id UUID PRIMARY KEY,
  advertiser_id UUID REFERENCES users(id),
  package_id INTEGER REFERENCES advertiser_packages(id),
  -- KWD values for compatibility
  purchased_budget DECIMAL(10,2) NOT NULL,
  remaining_budget DECIMAL(10,2) NOT NULL,
  used_budget DECIMAL(10,2) DEFAULT 0.00,
  -- Micro unit values for precise calculations
  budget_micro BIGINT NOT NULL,
  remaining_micro BIGINT NOT NULL,
  used_micro BIGINT DEFAULT 0,
  estimated_views INTEGER NOT NULL,
  views_completed INTEGER DEFAULT 0,
  status ENUM('active', 'used', 'expired') DEFAULT 'active',
  expires_at TIMESTAMP NULL,
  version INTEGER DEFAULT 1, -- Optimistic locking
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Key Relationships:**
- Links to `users` table (advertiser)
- Links to `advertiser_packages` table (package template)
- Links to `ads` table (one-to-many)

#### **`ads` Table Package Integration**
```sql
CREATE TABLE ads (
  id UUID PRIMARY KEY,
  advertiser_id UUID REFERENCES users(id),
  package_id INTEGER REFERENCES advertiser_packages(id),
  purchased_package_id UUID REFERENCES purchased_packages(id), -- REQUIRED
  -- ... other ad fields
);
```

### **2. Supporting Tables**

#### **`transactions` Table**
```sql
CREATE TABLE transactions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  type ENUM('credit', 'debit', 'package_purchase', 'view_reward', 'company_fee'),
  category ENUM('deposit', 'withdrawal', 'purchase', 'reward', 'fee'),
  amount_micro BIGINT NOT NULL,
  package_id INTEGER REFERENCES advertiser_packages(id), -- For package purchases
  purchased_package_id UUID REFERENCES purchased_packages(id), -- For view deductions
  -- ... other fields
);
```

#### **`view_events` Table**
```sql
CREATE TABLE view_events (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  ad_id UUID REFERENCES ads(id),
  purchased_package_id UUID REFERENCES purchased_packages(id), -- Links to package for deduction
  is_completed BOOLEAN DEFAULT FALSE,
  -- ... other fields
);
```

---

## 🔧 **BACKEND LAYER**

### **1. Core Models**

#### **`AdvertiserPackage` Model** (`backend/src/models/advertiser_package.js`)
```javascript
// Package template with pricing and duration
const AdvertiserPackage = sequelize.define('AdvertiserPackage', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING, allowNull: false },
  duration: { type: DataTypes.INTEGER, allowNull: false }, // seconds
  price_per_view_micro: { type: DataTypes.BIGINT, allowNull: false },
  description: { type: DataTypes.TEXT },
  is_active: { type: DataTypes.BOOLEAN, defaultValue: true }
});

// Instance methods for calculations
AdvertiserPackage.prototype.getPricePerViewKWD = function() {
  return this.price_per_view_micro / 1_000_000;
};

AdvertiserPackage.prototype.getViewerRewardMicro = function() {
  return Math.floor(this.price_per_view_micro / 2); // 50/50 split
};

AdvertiserPackage.prototype.getCompanyShareMicro = function() {
  const viewerShare = Math.floor(this.price_per_view_micro / 2);
  return this.price_per_view_micro - viewerShare;
};

// Class methods
AdvertiserPackage.getActivePackages = function() {
  return this.findAll({ where: { is_active: true } });
};
```

#### **`PurchasedPackage` Model** (`backend/src/models/purchased_package.js`)
```javascript
// Individual package purchase with budget tracking
const PurchasedPackage = sequelize.define('PurchasedPackage', {
  id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
  advertiser_id: { type: DataTypes.UUID, allowNull: false },
  package_id: { type: DataTypes.INTEGER, allowNull: false },
  // KWD values for compatibility
  purchased_budget: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  remaining_budget: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  used_budget: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0.00 },
  // Micro unit values for precise calculations
  budget_micro: { type: DataTypes.BIGINT, allowNull: false },
  remaining_micro: { type: DataTypes.BIGINT, allowNull: false },
  used_micro: { type: DataTypes.BIGINT, defaultValue: 0 },
  estimated_views: { type: DataTypes.INTEGER, allowNull: false },
  views_completed: { type: DataTypes.INTEGER, defaultValue: 0 },
  status: { type: DataTypes.ENUM('active', 'used', 'expired'), defaultValue: 'active' },
  version: { type: DataTypes.INTEGER, defaultValue: 1 } // Optimistic locking
});

// Key instance methods
PurchasedPackage.prototype.deductViewCost = async function(transaction) {
  // Deduct cost from remaining budget
  const pricePerViewMicro = this.package.price_per_view_micro;
  this.remaining_micro -= pricePerViewMicro;
  this.used_micro += pricePerViewMicro;
  this.views_completed += 1;
  await this.save({ transaction });
};

PurchasedPackage.prototype.canAffordView = function() {
  return this.remaining_micro > 0;
};
```

#### **`Ad` Model Package Integration** (`backend/src/models/ad.js`)
```javascript
const Ad = sequelize.define('Ad', {
  // ... other fields
  packageId: { type: DataTypes.INTEGER, allowNull: false },
  purchased_package_id: { type: DataTypes.UUID, allowNull: false }, // REQUIRED
  // ... other fields
});

// Associations
Ad.belongsTo(AdvertiserPackage, { foreignKey: 'package_id', as: 'package' });
Ad.belongsTo(PurchasedPackage, { foreignKey: 'purchased_package_id', as: 'purchasedPackage' });
```

### **2. Controllers**

#### **`advertiserController.js`** - Package Management
```javascript
// Get available packages
async function getPackages(req, res) {
  const packages = await AdvertiserPackage.getActivePackages();
  const transformedPackages = packages.map(pkg => unifyPackageData(pkg));
  res.json(transformedPackages);
}

// Purchase package with budget validation
async function purchasePackage(req, res) {
  const { packageId, budget } = req.body;
  const advertiserId = req.user.id;

  // Budget validation (300 KWD minimum, 100 KWD increments)
  const budgetValidation = validateBudget(budget);
  if (!budgetValidation.isValid) {
    return res.status(400).json({ message: budgetValidation.error });
  }

  // Check advertiser wallet balance
  const wallet = await Wallet.findByUserId(advertiserId);
  if (wallet.getAvailableBalanceMicro() < budgetValidation.budgetMicro) {
    return res.status(400).json({ message: 'Insufficient wallet balance' });
  }

  // Calculate estimated views
  const package = await AdvertiserPackage.findByPk(packageId);
  const estimatedViews = calculateViewsPurchased(budgetValidation.budgetMicro, package.price_per_view_micro);

  // Create purchased package
  const purchasedPackage = await PurchasedPackage.create({
    advertiser_id: advertiserId,
    package_id: packageId,
    purchased_budget: budgetValidation.budgetKWD,
    remaining_budget: budgetValidation.budgetKWD,
    budget_micro: budgetValidation.budgetMicro,
    remaining_micro: budgetValidation.budgetMicro,
    estimated_views: estimatedViews,
    status: 'active'
  });

  // Deduct from wallet and create transaction
  await wallet.deductBalance(budgetValidation.budgetMicro, transaction);
  await Transaction.createPackagePurchaseTransaction({
    fromWalletId: wallet.id,
    userId: advertiserId,
    amountMicro: budgetValidation.budgetMicro,
    packageId: packageId,
    estimatedViews
  }, transaction);
}
```

#### **`viewerController.js`** - Package Usage
```javascript
// Start watching ad (package deduction)
async function startWatchingAd(req, res) {
  const { adId } = req.body;
  const viewerId = req.user.id;

  const ad = await Ad.findOne({
    where: { id: adId, status: 'approved' },
    include: [{
      model: PurchasedPackage,
      as: 'purchasedPackage',
      include: [{ model: AdvertiserPackage, as: 'package' }]
    }]
  });

  // Check if package has budget
  if (!ad.purchasedPackage.canAffordView()) {
    return res.status(400).json({ message: 'Ad budget exhausted' });
  }

  // Create view event
  const viewEvent = await ViewEvent.create({
    user_id: viewerId,
    ad_id: adId,
    purchased_package_id: ad.purchasedPackage.id,
    is_completed: false
  });

  res.json({ success: true, proofToken: viewEvent.proof_token });
}

// Complete watching ad (reward distribution)
async function completeWatchingAd(req, res) {
  const { proofToken } = req.body;
  const viewerId = req.user.id;

  const viewEvent = await ViewEvent.findOne({
    where: { proof_token: proofToken, user_id: viewerId, is_completed: false },
    include: [{
      model: Ad,
      as: 'ad',
      include: [{
        model: PurchasedPackage,
        as: 'purchasedPackage',
        include: [{ model: AdvertiserPackage, as: 'package' }]
      }]
    }]
  });

  // Deduct from package budget
  await viewEvent.ad.purchasedPackage.deductViewCost(transaction);

  // Distribute rewards (50/50 split)
  const viewerReward = viewEvent.ad.purchasedPackage.package.getViewerRewardMicro();
  const companyShare = viewEvent.ad.purchasedPackage.package.getCompanyShareMicro();

  // Add reward to viewer wallet
  const viewerWallet = await Wallet.findByUserId(viewerId);
  await viewerWallet.addBalance(viewerReward, transaction);

  // Add company share to company wallet
  const companyWallet = await CompanyWallet.getMainWallet();
  await companyWallet.addBalance(companyShare, transaction);

  // Create transaction records
  await Transaction.createViewRewardTransaction({
    toWalletId: viewerWallet.id,
    userId: viewerId,
    amountMicro: viewerReward,
    adId: viewEvent.ad_id,
    purchasedPackageId: viewEvent.ad.purchasedPackage.id
  }, transaction);

  await Transaction.createCompanyFeeTransaction({
    toWalletId: companyWallet.id,
    amountMicro: companyShare,
    adId: viewEvent.ad_id,
    purchasedPackageId: viewEvent.ad.purchasedPackage.id
  }, transaction);
}
```

### **3. Constants & Utilities**

#### **`advertiser.js` Constants** (`backend/src/constants/advertiser.js`)
```javascript
// Micro-unit system constants
const MICRO_UNITS = 1_000_000; // 1,000,000 micro units = 1 KWD
const MIN_BUDGET_MICRO = 300 * MICRO_UNITS; // 300 KWD minimum
const BUDGET_INCREMENT_MICRO = 100 * MICRO_UNITS; // 100 KWD increments

// Package definitions
const PACKAGES = {
  P10: { duration: 10, pricePerViewMicro: 10_000 }, // 0.010 KWD
  P15: { duration: 15, pricePerViewMicro: 13_000 }, // 0.013 KWD
  P20: { duration: 20, pricePerViewMicro: 16_000 }, // 0.016 KWD
  P30: { duration: 30, pricePerViewMicro: 24_000 }  // 0.024 KWD
};

// Budget validation
function validateBudget(budget) {
  const budgetMicro = budget * MICRO_UNITS;
  if (budgetMicro < MIN_BUDGET_MICRO) {
    return { isValid: false, error: 'Budget must be at least 300 KWD' };
  }
  if (budgetMicro % BUDGET_INCREMENT_MICRO !== 0) {
    return { isValid: false, error: 'Budget must be in 100 KWD increments' };
  }
  return { isValid: true, budgetMicro, budgetKWD: budget };
}

// View calculation
function calculateViewsPurchased(budgetMicro, pricePerViewMicro) {
  return Math.floor(budgetMicro / pricePerViewMicro);
}
```

#### **`currencyUtils.js`** (`backend/src/utils/currencyUtils.js`)
```javascript
// Currency unification utilities
function unifyPackageData(package) {
  return {
    ...package.toJSON(),
    pricePerView: package.getPricePerViewKWD(),
    pricePerViewMicro: package.price_per_view_micro,
    viewerReward: package.getViewerRewardKWD(),
    companyShare: package.getCompanyShareKWD()
  };
}

function unifyPurchasedPackageData(purchasedPackage) {
  return {
    ...purchasedPackage.toJSON(),
    budget: purchasedPackage.getBudgetKWD(),
    remaining: purchasedPackage.getRemainingKWD(),
    used: purchasedPackage.getUsedKWD(),
    utilizationPercentage: purchasedPackage.getUtilizationPercentage()
  };
}
```

### **4. Routes**

#### **`advertiser.js` Routes** (`backend/src/routes/advertiser.js`)
```javascript
// Package management routes
router.get('/packages', authenticate, authorizeRoles('advertiser'), getPackages);
router.post('/packages/purchase', authenticate, authorizeRoles('advertiser'), purchasePackage);
router.get('/packages/purchased', authenticate, authorizeRoles('advertiser'), getPurchasedPackages);

// Ad creation with package integration
router.post('/ads', authenticate, authorizeRoles('advertiser'), upload.single('media'), createAd);
```

#### **`viewer.js` Routes** (`backend/src/routes/viewer.js`)
```javascript
// Package usage routes
router.post('/ads/start-watching', authenticate, authorizeRoles('viewer'), startWatchingAd);
router.post('/ads/complete-watching', authenticate, authorizeRoles('viewer'), completeWatchingAd);
```

---

## 🎨 **FRONTEND LAYER**

### **1. Package Display & Purchase**

#### **`AdvertiserPackages.jsx`** (`frontend/src/pages/AdvertiserPackages.jsx`)
```javascript
export default function AdvertiserPackages() {
  const [packages, setPackages] = useState([]);
  const [purchasedPackages, setPurchasedPackages] = useState([]);
  const [budget, setBudget] = useState(300); // Start at 300 KWD

  // Fetch available packages
  const fetchPackages = async () => {
    const [packagesRes, purchasedRes] = await Promise.all([
      api.get('/api/advertiser/packages'),
      api.get('/api/advertiser/packages/purchased')
    ]);
    
    setPackages(packagesRes.data || []);
    setPurchasedPackages(purchasedRes.data.purchasedPackages || []);
  };

  // Purchase package
  const handlePurchase = async (packageId, budget) => {
    const response = await api.post('/api/advertiser/packages/purchase', {
      packageId,
      budget
    });
    
    if (response.data.success) {
      setSuccess('Package purchased successfully!');
      fetchPackages(); // Refresh data
    }
  };

  // Package selection with budget validation
  const handlePackageSelect = (pkg) => {
    setPackageToPurchase(pkg);
    setBudget(300); // Reset to 300 KWD
    setPurchaseDialogOpen(true);
  };

  return (
    <Container>
      {/* Package Display Grid */}
      <Grid container spacing={3}>
        {packages.map((pkg) => (
          <Grid item xs={12} md={6} lg={3} key={pkg.id}>
            <Card>
              <CardContent>
                <Typography variant="h6">{pkg.name}</Typography>
                <Typography>Duration: {pkg.duration}s</Typography>
                <Typography>Price: {formatKWD(pkg.pricePerView)}/view</Typography>
                <Typography>Viewer Reward: {formatKWD(pkg.viewerReward)}</Typography>
                <Button onClick={() => handlePackageSelect(pkg)}>
                  Purchase Package
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Purchase Dialog */}
      <Dialog open={purchaseDialogOpen}>
        <DialogContent>
          <Typography>Select Budget:</Typography>
          <TextField
            type="number"
            value={budget}
            onChange={(e) => setBudget(Number(e.target.value))}
            inputProps={{ min: 300, step: 100 }}
          />
          <Typography>
            Estimated Views: {calculateEstimatedViews(budget, packageToPurchase?.pricePerView)}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => handlePurchase(packageToPurchase.id, budget)}>
            Confirm Purchase
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
```

### **2. Ad Creation with Package Integration**

#### **`CreateAd.jsx`** (`frontend/src/pages/CreateAd.jsx`)
```javascript
export default function CreateAd() {
  const [purchasedPackages, setPurchasedPackages] = useState([]);
  const [selectedPackage, setSelectedPackage] = useState(null);

  // Fetch advertiser's purchased packages
  const fetchPurchasedPackages = async () => {
    const response = await api.get('/api/advertiser/packages/purchased');
    const activePackages = response.data.purchasedPackages.filter(pkg => 
      pkg.status === 'active' && pkg.remaining > 0
    );
    setPurchasedPackages(activePackages);
  };

  // Create ad with package
  const handleCreateAd = async (adData) => {
    const formData = new FormData();
    formData.append('media', adData.media);
    formData.append('title', adData.title);
    formData.append('description', adData.description);
    formData.append('section', adData.section);
    formData.append('purchasedPackageId', selectedPackage.id); // REQUIRED

    const response = await api.post('/api/advertiser/ads', formData);
    
    if (response.data.success) {
      // Package status changes to 'used' after ad creation
      setSuccess('Ad created successfully!');
      fetchPurchasedPackages(); // Refresh available packages
    }
  };

  return (
    <Container>
      {/* Package Selection */}
      <FormControl fullWidth>
        <InputLabel>Select Package</InputLabel>
        <Select value={selectedPackage?.id || ''} onChange={(e) => {
          const pkg = purchasedPackages.find(p => p.id === e.target.value);
          setSelectedPackage(pkg);
        }}>
          {purchasedPackages.map((pkg) => (
            <MenuItem key={pkg.id} value={pkg.id}>
              {pkg.package.name} - {formatKWD(pkg.remaining)} remaining
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* Ad Creation Form */}
      <form onSubmit={handleCreateAd}>
        {/* ... ad form fields ... */}
        <Button type="submit" disabled={!selectedPackage}>
          Create Ad
        </Button>
      </form>
    </Container>
  );
}
```

### **3. Video Player Package Integration**

#### **`TikTokVideoPlayer.jsx`** (`frontend/src/components/TikTokVideoPlayer.jsx`)
```javascript
export default function TikTokVideoPlayer({ video, onVideoComplete, onEarnCredits }) {
  const [isProcessingReward, setIsProcessingReward] = useState(false);

  // Start watching video (package deduction)
  const startVideoWatching = async () => {
    try {
      const response = await api.post('/api/viewer/ads/start-watching', {
        adId: video.id
      });
      
      if (response.data.success) {
        setCurrentProofToken(response.data.proofToken);
        setViewStartTime(Date.now());
      }
    } catch (error) {
      console.error('Failed to start watching:', error);
    }
  };

  // Complete watching video (reward distribution)
  const handleVideoComplete = async () => {
    try {
      setIsProcessingReward(true);
      
      const response = await api.post('/api/viewer/ads/complete-watching', {
        proofToken: currentProofToken
      });
      
      if (response.data.success) {
        const reward = response.data.reward;
        onEarnCredits(reward);
        onVideoComplete(video.id);
      }
    } catch (error) {
      console.error('Failed to complete watching:', error);
    } finally {
      setIsProcessingReward(false);
    }
  };

  return (
    <Box>
      {/* Video Player */}
      <video
        src={video.mediaUrl}
        onEnded={handleVideoComplete}
        // ... other props
      />

      {/* Package Info Display */}
      <Box>
        <Typography>
          Package: {video.package?.name} ({video.package?.duration}s)
        </Typography>
        <Typography>
          Reward: {formatKWD(video.videoReward)}
        </Typography>
      </Box>

      {/* Processing Overlay */}
      {isProcessingReward && (
        <Box>
          <CircularProgress />
          <Typography>Processing Reward...</Typography>
        </Box>
      )}
    </Box>
  );
}
```

### **4. Constants & Utilities**

#### **`advertiser.js` Constants** (`frontend/src/constants/advertiser.js`)
```javascript
export const AD_PACKAGES = [
  { 
    id: 1, 
    label: '10s @0.010 KWD/view', 
    duration: 10, 
    costPerView: 0.010, 
    viewerFils: 0.005, 
    companyFils: 0.005, 
    baseBudget: 300, 
    increment: 100 
  },
  { 
    id: 2, 
    label: '15s @0.013 KWD/view', 
    duration: 15, 
    costPerView: 0.013, 
    viewerFils: 0.0065, 
    companyFils: 0.0065, 
    baseBudget: 300, 
    increment: 100 
  },
  { 
    id: 3, 
    label: '20s @0.016 KWD/view', 
    duration: 20, 
    costPerView: 0.016, 
    viewerFils: 0.008, 
    companyFils: 0.008, 
    baseBudget: 300, 
    increment: 100 
  },
  { 
    id: 4, 
    label: '30s @0.024 KWD/view', 
    duration: 30, 
    costPerView: 0.024, 
    viewerFils: 0.012, 
    companyFils: 0.012, 
    baseBudget: 300, 
    increment: 100 
  }
];
```

#### **`currencyUtils.js`** (`frontend/src/utils/currencyUtils.js`)
```javascript
// Budget validation
export function isValidBudget(budget) {
  return budget >= 300 && budget % 100 === 0;
}

export function getNextValidBudget(currentBudget) {
  return currentBudget + 100;
}

export function getPreviousValidBudget(currentBudget) {
  return Math.max(300, currentBudget - 100);
}

// View calculation
export function calculateEstimatedViews(budget, pricePerView) {
  if (!pricePerView) return 0;
  return Math.floor(budget / pricePerView);
}

// Currency formatting
export function formatKWD(amount) {
  return new Intl.NumberFormat('en-KW', {
    style: 'currency',
    currency: 'KWD',
    minimumFractionDigits: 3
  }).format(amount);
}
```

---

## 🔗 **SYSTEM CONNECTIONS & WIRINGS**

### **1. Package Purchase Flow**
```
1. Advertiser selects package → AdvertiserPackages.jsx
2. Sets budget (300-1000 KWD, 100 KWD increments) → Budget validation
3. Clicks purchase → POST /api/advertiser/packages/purchase
4. Backend validates budget → validateBudget()
5. Checks wallet balance → Wallet.findByUserId()
6. Creates PurchasedPackage → PurchasedPackage.create()
7. Deducts from wallet → wallet.deductBalance()
8. Creates transaction → Transaction.createPackagePurchaseTransaction()
9. Returns success → Frontend updates UI
```

### **2. Ad Creation Flow**
```
1. Advertiser creates ad → CreateAd.jsx
2. Selects purchased package → Package dropdown
3. Uploads media + fills form → Form validation
4. Submits ad → POST /api/advertiser/ads
5. Backend validates package → PurchasedPackage validation
6. Creates Ad with package link → Ad.create()
7. Updates package status → status: 'used'
8. Returns success → Frontend redirects
```

### **3. Video Viewing Flow**
```
1. Viewer sees ad → TikTokVideoPlayer.jsx
2. Clicks play → startVideoWatching()
3. POST /api/viewer/ads/start-watching → Creates ViewEvent
4. Video plays → onEnded event
5. handleVideoComplete() → completeWatchingAd()
6. POST /api/viewer/ads/complete-watching
7. Backend deducts from package → deductViewCost()
8. Distributes rewards → 50/50 split
9. Creates transactions → View reward + Company fee
10. Returns reward → Frontend updates credits
```

### **4. Budget Tracking Flow**
```
1. Package purchase → budget_micro set
2. Each view → remaining_micro decreases
3. View completion → used_micro increases
4. Transaction records → All financial movements
5. Real-time updates → Dashboard displays
6. Budget exhaustion → Package becomes inactive
```

---

## 📊 **PACKAGE TYPES & PRICING**

### **Available Packages**
| Package | Duration | Price/View | Viewer Reward | Company Fee | Min Budget | Increment |
|---------|----------|------------|---------------|-------------|------------|-----------|
| P10     | 10s      | 0.010 KWD  | 0.005 KWD     | 0.005 KWD   | 300 KWD    | 100 KWD   |
| P15     | 15s      | 0.013 KWD  | 0.0065 KWD    | 0.0065 KWD  | 300 KWD    | 100 KWD   |
| P20     | 20s      | 0.016 KWD  | 0.008 KWD     | 0.008 KWD   | 300 KWD    | 100 KWD   |
| P30     | 30s      | 0.024 KWD  | 0.012 KWD     | 0.012 KWD   | 300 KWD    | 100 KWD   |

### **Budget Options**
- **Minimum**: 300 KWD
- **Maximum**: No limit
- **Increment**: 100 KWD only
- **Valid budgets**: 300, 400, 500, 600, 700, 800, 900, 1000, etc.

### **Reward Distribution**
- **50/50 Split**: Viewer gets half, company gets half
- **Micro-unit precision**: All calculations in micro units (1,000,000 = 1 KWD)
- **Automatic distribution**: On video completion

---

## 🔒 **SECURITY & VALIDATION**

### **1. Budget Validation**
- Minimum 300 KWD requirement
- 100 KWD increment validation
- Wallet balance verification
- Optimistic locking for concurrency

### **2. Package Validation**
- Active package status check
- Remaining budget verification
- Package expiration handling
- Proof token validation

### **3. Transaction Security**
- All financial operations in transactions
- Rollback on failure
- Audit trail via transaction records
- Micro-unit precision to prevent rounding errors

---

## 📈 **MONITORING & ANALYTICS**

### **1. Package Performance**
- Views completed vs estimated
- Budget utilization percentage
- Package popularity metrics
- Revenue generation tracking

### **2. Financial Tracking**
- Total package purchases
- Revenue per package type
- Viewer reward distribution
- Company fee collection

### **3. System Health**
- Package availability status
- Budget exhaustion alerts
- Transaction success rates
- Error monitoring and logging

---

## 🎯 **KEY FEATURES**

### **1. Micro-Unit System**
- Eliminates decimal precision issues
- Atomic-level financial calculations
- 1,000,000 micro units = 1 KWD
- Dual storage (KWD + micro units)

### **2. Optimistic Locking**
- Prevents concurrent modification conflicts
- Version tracking for data integrity
- Retry logic for failed operations

### **3. Real-Time Budget Tracking**
- Live budget updates
- Automatic status changes
- Immediate reward distribution
- Transaction transparency

### **4. Flexible Package System**
- Multiple duration options
- Configurable pricing
- Active/inactive status management
- Easy package addition/modification

---

## 🔧 **MAINTENANCE & SCALABILITY**

### **1. Database Optimization**
- Indexed foreign keys
- Optimized queries with includes
- Efficient budget calculations
- Transaction batching

### **2. API Performance**
- Cached package data
- Optimized response formats
- Efficient error handling
- Rate limiting protection

### **3. Frontend Optimization**
- Lazy loading of package data
- Optimistic UI updates
- Efficient state management
- Responsive design

---

## 📋 **CONCLUSION**

The **Ads Package System** is a comprehensive, well-architected solution that provides:

✅ **Complete package lifecycle management** (purchase → usage → completion)  
✅ **Precise financial calculations** (micro-unit system)  
✅ **Real-time budget tracking** (live updates)  
✅ **Secure transaction handling** (optimistic locking)  
✅ **Flexible pricing structure** (multiple package types)  
✅ **Automatic reward distribution** (50/50 split)  
✅ **Comprehensive monitoring** (analytics & tracking)  
✅ **Scalable architecture** (optimized performance)  

The system is fully integrated across frontend, backend, and database layers with robust error handling, security measures, and performance optimizations.
