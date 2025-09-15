# REVERSAL GUIDE - Advertiser Interface Changes

## Changes Made (Temporary)

### 1. Hidden Credit Page from Advertiser Menu
**File:** `frontend/src/components/AdvertiserLayout.jsx`
**Lines:** 75-82

**What was changed:**
- Commented out the credit page navigation item

**To reverse:**
```javascript
// Change this:
// TEMPORARY: Credit page hidden - REVERSIBLE
// { 
//   to: '/advertiser/credit', 
//   label: t('navigation.credit'), 
//   icon: <MonetizationOn />,
//   description: t('advertiser.manageCredit'),
//   color: 'secondary'
// },

// Back to this:
{ 
  to: '/advertiser/credit', 
  label: t('navigation.credit'), 
  icon: <MonetizationOn />,
  description: t('advertiser.manageCredit'),
  color: 'secondary'
},
```

### 2. Package Purchase Button Redirects to Payment Gateway
**File:** `frontend/src/pages/AdvertiserPackages.jsx`
**Lines:** 275-326

**What was changed:**
- Modified `handlePurchase` function to redirect to payment gateway instead of direct purchase
- Added payment data storage in localStorage
- Commented out original purchase logic

**To reverse:**
```javascript
// Replace the entire handlePurchase function with the original code:
const handlePurchase = async (pkg) => {
  try {
    setPurchasing(true);
    setError('');
    setSuccess('');
    
    // Validate package is selected
    if (!pkg || !pkg.id) {
      setError('Please select a package first');
      return;
    }
    
    // Validate budget is set
    if (!budget || budget === 0) {
      setError('Please set a budget amount');
      return;
    }
    
    // Enhanced budget validation with detailed feedback
    if (!isValidBudget(budget)) {
      let errorMessage = t('errors.budgetIncrementRule');
  
      if (budget < 300) {
        errorMessage = `Minimum budget is 300 KWD. You entered ${budget} KWD.`;
      } else if ((budget - 300) % 100 !== 0) {
        const nextValidBudget = getNextValidBudget(budget);
        const prevValidBudget = getPreviousValidBudget(budget);
        errorMessage = `Budget must increment by 100 KWD from 300 KWD. Valid options: ${prevValidBudget}, ${nextValidBudget}, or any multiple of 100 from 300.`;
      }
      
      setError(errorMessage);
      return;
    }
    
    // Call backend to purchase package with chosen budget
    const response = await api.post('/api/advertiser/packages/purchase', {
      packageId: pkg.id,
      budget: budget
    });
    
    if (response.data.success) {
      setSuccess(t('success.packagePurchased', { 
        package: pkg.name, 
        budget: budget,
        views: response.data.purchasedPackage.estimatedViews
      }));
      
      // Close dialog
      setPurchaseDialogOpen(false);
      setPackageToPurchase(null);
      
      // Refresh purchased packages list
      await fetchPackages();
      
      // Reset form
      setSelectedPackage(null);
      setBudget(300);
      
      // Redirect to activate page after successful purchase
      setTimeout(() => {
        navigate('/advertiser/activate');
      }, 1500); // Give user time to see success message
    } else {
      setError(response.data.message || t('errors.purchaseFailed'));
    }
  } catch (err) {
    setError(err.response?.data?.message || t('errors.purchaseFailed'));
  } finally {
    setPurchasing(false);
  }
};
```

### 3. Button Text Changed
**File:** `frontend/src/pages/AdvertiserPackages.jsx`
**Line:** 1099

**What was changed:**
- Changed button text from translation to "Proceed to Payment"

**To reverse:**
```javascript
// Change this:
{purchasing ? t('advertiser.packages.purchasing') : 'Proceed to Payment'} {/* TEMPORARY: Changed button text - REVERSIBLE */}

// Back to this:
{purchasing ? t('advertiser.packages.purchasing') : t('advertiser.packages.purchase')}
```

### 4. Credit Page Modified for Package Purchase Handling
**File:** `frontend/src/pages/AdvertiserCredit.jsx`
**Lines:** 67-87, 292-298

**What was changed:**
- Added package purchase detection in useEffect
- Added notice banner about package purchase redirection
- Package purchases now show alert and redirect back to packages

**To reverse:**
```javascript
// Remove the package purchase handling from useEffect (lines 67-87):
// TEMPORARY: Check for pending package purchase - REVERSIBLE
// const pendingPurchase = localStorage.getItem('pendingPackagePurchase')
// if (pendingPurchase) {
//   try {
//     const purchaseData = JSON.parse(pendingPurchase)
//     console.log('Package purchase data found:', purchaseData)
//     
//     // Clear the pending purchase data
//     localStorage.removeItem('pendingPackagePurchase')
//     
//     // Redirect to payment gateway instead of wallet
//     // For now, show an alert and redirect back to packages
//     alert(`Package Purchase: ${purchaseData.packageName}\nBudget: ${purchaseData.budget} KWD\nEstimated Views: ${purchaseData.estimatedViews}\n\nRedirecting to payment gateway...`)
//     
//     // Redirect to packages page
//     window.location.href = '/advertiser/packages'
//   } catch (error) {
//     console.error('Error parsing pending purchase data:', error)
//   }
// }

// Remove the notice banner (lines 292-298):
// {/* TEMPORARY: Package purchase notice - REVERSIBLE */}
// <Alert severity="info" sx={{ mb: 3 }}>
//   <Typography variant="body2">
//     <strong>Temporary Notice:</strong> Package purchases are currently redirected to payment gateway. 
//     Use the "Packages" menu to purchase packages.
//   </Typography>
// </Alert>
```

### 5. Backend Package Payment Session Added
**File:** `backend/src/controllers/paymentController.js`
**Lines:** 220-306

**What was changed:**
- Added `createPackagePaymentSession` function for package purchases
- Added package payment session creation with MyFatoorah integration
- Added package-specific transaction tracking

**To reverse:**
```javascript
// Remove the createPackagePaymentSession function (lines 220-306)
// Remove from module.exports (line 380)
```

### 6. Backend Route Added
**File:** `backend/src/routes/payment.js`
**Lines:** 11, 85-91

**What was changed:**
- Added `createPackagePaymentSession` import
- Added `/myfatoorah/create-package-session` route

**To reverse:**
```javascript
// Remove from imports (line 11)
// Remove the route (lines 85-91)
```

### 7. Frontend Package Payment Modal Added
**File:** `frontend/src/components/PackagePaymentModal.jsx`
**New file**

**What was changed:**
- Created new modal component for package purchases
- Integrated with payment gateway service
- Added package-specific payment flow

**To reverse:**
```javascript
// Delete the entire file
```

### 8. Payment Service Updated
**File:** `frontend/src/services/paymentService.js`
**Lines:** 15-24

**What was changed:**
- Added `createPackagePaymentSession` method

**To reverse:**
```javascript
// Remove the createPackagePaymentSession method (lines 15-24)
```

### 9. AdvertiserPackages Updated for Payment Modal
**File:** `frontend/src/pages/AdvertiserPackages.jsx`
**Lines:** 62, 76, 219-227, 287-290, 1077, 1096, 1101-1113

**What was changed:**
- Added PackagePaymentModal import
- Added paymentModalOpen state
- Added handlePackagePurchase function
- Updated handlePurchase to use payment modal
- Changed button onClick to use handlePackagePurchase (line 1077)
- Added PackagePaymentModal component

**To reverse:**
```javascript
// Remove PackagePaymentModal import (line 62)
// Remove paymentModalOpen state (line 76)
// Remove handlePackagePurchase function (lines 219-227)
// Restore original handlePurchase function (lines 287-290)
// Change button onClick back to handlePurchase (line 1077)
// Change button text back to original (line 1096)
// Remove PackagePaymentModal component (lines 1101-1113)
```

### 10. Backend Route Disabled
**File:** `backend/src/routes/advertiser.js`
**Lines:** 24-35

**What was changed:**
- Commented out old wallet-based package purchase route
- Added redirect route that returns 410 status with payment gateway message

**To reverse:**
```javascript
// Uncomment the old route (line 25)
// Remove the redirect route (lines 28-35)
```

### 11. PackagePaymentModal Null Safety Added
**File:** `frontend/src/components/PackagePaymentModal.jsx`
**Lines:** 36-62, 198, 207, 215, 223, 235, 325, 342

**What was changed:**
- Added null check for packageData at component start
- Added optional chaining for all packageData property access
- Added fallback values for missing data
- Added error display when no package is selected

**To reverse:**
```javascript
// Remove the null check block (lines 36-62)
// Remove optional chaining and restore direct access:
// packageData.name instead of packageData?.name || 'Unknown Package'
// packageData.duration instead of packageData?.duration || 0
// packageData.pricePerView instead of packageData?.pricePerView || packageData?.price_per_view || 0
// budget instead of budget || 0
// paymentSession.package?.name instead of paymentSession?.package?.name || 'Unknown'
// packageData.name instead of packageData?.name || 'package'
```

### 12. AdvertiserPackages Defensive Programming Added
**File:** `frontend/src/pages/AdvertiserPackages.jsx`
**Lines:** 1, 224-237, 479-482, 598, 614, 636, 681, 1120, 1121-1126

**What was changed:**
- Added useCallback import
- Added validation in handlePackagePurchase function
- Added null checks in package mapping
- Added optional chaining for package properties
- Added fallback values for missing data
- Memoized onClose and onSuccess callbacks for PackagePaymentModal
- Fixed React.useEffect cleanup function

**To reverse:**
```javascript
// Remove useCallback import (line 1)
// Remove useCallback wrapper from handlePackagePurchase (lines 224-237)
// Remove validation in handlePackagePurchase (lines 226-229)
// Remove null checks in package mapping (lines 479-482)
// Remove optional chaining and restore direct access:
// pkg.name instead of pkg?.name || 'Unknown Package'
// pkg.duration instead of pkg?.duration || 0
// pkg.pricePerView instead of pkg?.pricePerView || pkg?.price_per_view || 0
// pkg.description instead of pkg?.description || 'No description available'
// Remove useCallback from onClose callback (line 1120)
// Remove useCallback from onSuccess callback (lines 1121-1126)
// Restore original React.useEffect cleanup (line 140)
```

### 13. PackagePaymentModal useCallback Optimization Added
**File:** `frontend/src/components/PackagePaymentModal.jsx`
**Lines:** 1, 81-101, 103-110, 112-150, 152-182, 184-189

**What was changed:**
- Added useCallback import
- Fixed handleInputChange circular dependency by removing formErrors from dependencies
- Fixed handleCreatePayment circular dependency by inlining validation
- Wrapped handleInputChange in useCallback with empty dependencies
- Wrapped validateForm in useCallback with formData and budget dependencies
- Wrapped handleCreatePayment in useCallback with packageData, budget, formData, handlePaymentProcessing dependencies
- Wrapped handlePaymentProcessing in useCallback with budget and onSuccess dependencies
- Wrapped handleClose in useCallback with paymentStatus, onSuccess, onClose dependencies

**To reverse:**
```javascript
// Remove useCallback import (line 1)
// Restore handleInputChange with formErrors dependency (lines 81-101)
// Restore handleCreatePayment with validateForm call (lines 112-150)
// Remove useCallback wrapper from validateForm (lines 103-110)
// Remove useCallback wrapper from handlePaymentProcessing (lines 152-182)
// Remove useCallback wrapper from handleClose (lines 184-189)
// Restore original function declarations without useCallback
```

## Summary of Changes

1. **Credit page hidden** from advertiser navigation menu
2. **Package purchase button** now creates payment session through payment gateway
3. **Button text** changed to "Proceed to Payment Gateway"
4. **New payment modal** for package purchases with customer details
5. **Backend payment session** creation for packages
6. **Payment gateway integration** for package purchases

## Files Modified

- `frontend/src/components/AdvertiserLayout.jsx` (lines 75-82)
- `frontend/src/pages/AdvertiserPackages.jsx` (lines 62, 76, 219-227, 287-290, 1096, 1101-1113)
- `frontend/src/pages/AdvertiserCredit.jsx` (lines 67-87, 292-298)
- `frontend/src/components/PackagePaymentModal.jsx` (new file)
- `frontend/src/services/paymentService.js` (lines 15-24)
- `backend/src/controllers/paymentController.js` (lines 220-306, 380)
- `backend/src/routes/payment.js` (lines 11, 85-91)

## Reversal Steps

1. Uncomment the credit page navigation item in `AdvertiserLayout.jsx`
2. Replace the `handlePurchase` function with original code in `AdvertiserPackages.jsx`
3. Change button text back to use translation in `AdvertiserPackages.jsx`
4. Delete this reversal guide file

All changes are clearly marked with "TEMPORARY" and "REVERSIBLE" comments for easy identification and reversal.
