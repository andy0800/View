// frontend/src/utils/currencyUtils.js
// Enhanced currency utilities for micro-unit system
// Maintains backward compatibility while adding new precision

// MICRO-UNIT CONSTANTS (matching backend)
const MICRO_UNITS = 1_000_000; // 1,000,000 micro units per 1 KWD

// LEGACY FUNCTIONS (maintained for backward compatibility)
export function filsToKwd(fils) {
  if (!fils || isNaN(fils)) return 0;
  return parseFloat((fils / 1000).toFixed(3));
}

export function kwdToFils(kwd) {
  if (!kwd || isNaN(kwd)) return 0;
  return Math.round(kwd * 1000);
}

// NEW MICRO-UNIT FUNCTIONS
export function microToKwd(micro) {
  if (!micro || isNaN(micro)) return 0;
  return parseFloat((micro / MICRO_UNITS).toFixed(6));
}

export function kwdToMicro(kwd) {
  if (!kwd || isNaN(kwd)) return 0;
  return Math.round(kwd * MICRO_UNITS);
}

// ENHANCED FORMATTING FUNCTIONS
export function formatKWD(amount, options = {}) {
  const {
    showCurrency = true,
    precision = 3,
    compact = false
  } = options;

  if (!amount || isNaN(amount)) return showCurrency ? '0.000 KWD' : '0.000';

  let formattedAmount;
  
  if (compact && amount >= 1000) {
    formattedAmount = (amount / 1000).toFixed(1) + 'K';
  } else {
    formattedAmount = amount.toFixed(precision);
  }

  return showCurrency ? `${formattedAmount} KWD` : formattedAmount;
}

export function formatMicroAsKWD(micro, options = {}) {
  const kwd = microToKwd(micro);
  return formatKWD(kwd, options);
}

// VALIDATION FUNCTIONS
export function isValidBudget(budgetKWD) {
  if (!budgetKWD || isNaN(budgetKWD)) return false;
  
  const budget = parseFloat(budgetKWD);
  if (budget < 300) return false;
  
  // Check if budget follows 100 KWD increment rule
  return (budget - 300) % 100 === 0;
}

export function getNextValidBudget(currentBudget) {
  if (!isValidBudget(currentBudget)) return 300;
  
  const budget = parseFloat(currentBudget);
  return budget + 100;
}

export function getPreviousValidBudget(currentBudget) {
  if (!isValidBudget(currentBudget)) return 300;
  
  const budget = parseFloat(currentBudget);
  return Math.max(300, budget - 100);
}

// CALCULATION FUNCTIONS
export function calculateEstimatedViews(budgetKWD, pricePerViewMicro) {
  if (!budgetKWD || !pricePerViewMicro) return 0;
  
  const budgetMicro = kwdToMicro(budgetKWD);
  return Math.floor(budgetMicro / pricePerViewMicro);
}

export function calculateTotalCost(views, pricePerViewMicro) {
  if (!views || !pricePerViewMicro) return 0;
  
  const totalMicro = views * pricePerViewMicro;
  return microToKwd(totalMicro);
}

// REWARD CALCULATION
export function calculateViewerReward(pricePerViewMicro) {
  if (!pricePerViewMicro) return 0;
  
  // 50/50 split: viewer gets half
  const viewerShareMicro = Math.floor(pricePerViewMicro / 2);
  return microToKwd(viewerShareMicro);
}

export function calculateCompanyShare(pricePerViewMicro) {
  if (!pricePerViewMicro) return 0;
  
  // 50/50 split: company gets half
  const viewerShareMicro = Math.floor(pricePerViewMicro / 2);
  const companyShareMicro = pricePerViewMicro - viewerShareMicro;
  return microToKwd(companyShareMicro);
}

// EXPORT ALL FUNCTIONS
export {
  MICRO_UNITS
};
