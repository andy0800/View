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

## Summary of Changes

1. **Credit page hidden** from advertiser navigation menu
2. **Package purchase button** now redirects to payment gateway instead of direct purchase
3. **Button text** changed to "Proceed to Payment"
4. **Payment data** stored in localStorage for payment gateway processing

## Files Modified

- `frontend/src/components/AdvertiserLayout.jsx` (lines 75-82)
- `frontend/src/pages/AdvertiserPackages.jsx` (lines 275-326, 1099)

## Reversal Steps

1. Uncomment the credit page navigation item in `AdvertiserLayout.jsx`
2. Replace the `handlePurchase` function with original code in `AdvertiserPackages.jsx`
3. Change button text back to use translation in `AdvertiserPackages.jsx`
4. Delete this reversal guide file

All changes are clearly marked with "TEMPORARY" and "REVERSIBLE" comments for easy identification and reversal.
