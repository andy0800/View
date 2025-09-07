// backend/src/constants/advertiser.js
// NEW MICRO-UNIT SYSTEM: 1,000,000 micro units = 1 KWD
// This eliminates all decimal precision issues and provides atomic-level accuracy

// MICRO-UNIT CONSTANTS
const MICRO_UNITS = 1_000_000; // 1,000,000 micro units per 1 KWD
const MIN_BUDGET_MICRO = 300 * MICRO_UNITS; // 300 KWD minimum
const BUDGET_INCREMENT_MICRO = 100 * MICRO_UNITS; // 100 KWD increments

// PACKAGE DEFINITIONS WITH MICRO-UNIT PRICING
const PACKAGES = {
  P10: {
    id: 1,
    name: 'P10 - 10 Second Package',
    durationSec: 10,
    pricePerViewMicro: 10_000, // 0.010 KWD = 10,000 micro units
    description: '10-second video ads with maximum engagement',
    isActive: true
  },
  P15: {
    id: 2,
    name: 'P15 - 15 Second Package',
    durationSec: 15,
    pricePerViewMicro: 14_000, // 0.014 KWD = 14,000 micro units
    description: '15-second video ads for detailed messaging',
    isActive: true
  },
  P20: {
    id: 3,
    name: 'P20 - 20 Second Package',
    durationSec: 20,
    pricePerViewMicro: 16_000, // 0.016 KWD = 16,000 micro units
    description: '20-second video ads with comprehensive content',
    isActive: true
  },
  P30: {
    id: 4,
    name: 'P30 - 30 Second Package',
    durationSec: 30,
    pricePerViewMicro: 24_000, // 0.024 KWD = 24,000 micro units
    description: '30-second video ads for full storytelling',
    isActive: true
  }
};

// BUDGET VALIDATION FUNCTIONS
const validateBudget = (budgetKWD) => {
  const budgetMicro = Math.round(budgetKWD * MICRO_UNITS);
  
  if (budgetMicro < MIN_BUDGET_MICRO) {
    return {
      isValid: false,
      error: `Minimum budget is ${MIN_BUDGET_MICRO / MICRO_UNITS} KWD`
    };
  }
  
  const remainder = (budgetMicro - MIN_BUDGET_MICRO) % BUDGET_INCREMENT_MICRO;
  if (remainder !== 0) {
    return {
      isValid: false,
      error: `Budget must increment by ${BUDGET_INCREMENT_MICRO / MICRO_UNITS} KWD from ${MIN_BUDGET_MICRO / MICRO_UNITS} KWD`
    };
  }
  
  return {
    isValid: true,
    budgetMicro,
    budgetKWD: budgetMicro / MICRO_UNITS
  };
};

// REWARD CALCULATION FUNCTIONS
const calculateViewRewards = (pricePerViewMicro) => {
  // Split 50/50: viewer gets half, company gets half
  const viewerShareMicro = Math.floor(pricePerViewMicro / 2);
  const companyShareMicro = pricePerViewMicro - viewerShareMicro;
  
  return {
    viewerShareMicro,
    companyShareMicro,
    totalMicro: pricePerViewMicro
  };
};

const calculateViewsPurchased = (budgetMicro, pricePerViewMicro) => {
  return Math.floor(budgetMicro / pricePerViewMicro);
};

// CONVERSION UTILITIES
const kwdToMicro = (kwd) => Math.round(kwd * MICRO_UNITS);
const microToKwd = (micro) => micro / MICRO_UNITS;

// PACKAGE SELECTION HELPERS
const getActivePackages = () => {
  return Object.values(PACKAGES).filter(pkg => pkg.isActive);
};

const getPackageById = (id) => {
  return Object.values(PACKAGES).find(pkg => pkg.id === id);
};

const getPackageByName = (name) => {
  return Object.values(PACKAGES).find(pkg => pkg.name === name);
};

// EXPORT ALL CONSTANTS AND FUNCTIONS
module.exports = {
  // Core constants
  MICRO_UNITS,
  MIN_BUDGET_MICRO,
  BUDGET_INCREMENT_MICRO,
  
  // Package definitions
  PACKAGES,
  
  // Validation functions
  validateBudget,
  
  // Calculation functions
  calculateViewRewards,
  calculateViewsPurchased,
  
  // Conversion utilities
  kwdToMicro,
  microToKwd,
  
  // Package helpers
  getActivePackages,
  getPackageById,
  getPackageByName
};