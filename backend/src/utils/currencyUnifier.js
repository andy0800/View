// backend/src/utils/currencyUnifier.js

/**
 * Unifies currency data between micro-units and KWD formats
 * Ensures consistent data structure for frontend consumption
 */

const MICRO_UNIT_DIVISOR = 1_000_000;

/**
 * Convert micro units to KWD
 * @param {number|string} microUnits - Amount in micro units
 * @returns {number} Amount in KWD
 */
const microToKwd = (microUnits) => {
  if (!microUnits || isNaN(microUnits)) return 0;
  return parseFloat(microUnits) / MICRO_UNIT_DIVISOR;
};

/**
 * Convert KWD to micro units
 * @param {number|string} kwd - Amount in KWD
 * @returns {number} Amount in micro units
 */
const kwdToMicro = (kwd) => {
  if (!kwd || isNaN(kwd)) return 0;
  return Math.round(parseFloat(kwd) * MICRO_UNIT_DIVISOR);
};

/**
 * Unify package data to include both micro and KWD values
 * @param {Object} package - Package object from database
 * @returns {Object} Unified package with both formats
 */
const unifyPackageData = (pkg) => {
  if (!pkg) return null;
  
  return {
    ...pkg.toJSON ? pkg.toJSON() : pkg,
    // Ensure both micro and KWD values are available
    pricePerView: pkg.price_per_view_micro ? microToKwd(pkg.price_per_view_micro) : pkg.price_per_view,
    pricePerViewMicro: pkg.price_per_view_micro || (pkg.price_per_view ? kwdToMicro(pkg.price_per_view) : 0),
    // ✅ FIXED: Remove hardcoded fallback values - use dynamic calculation
    viewerReward: pkg.viewer_reward || (pkg.price_per_view_micro ? microToKwd(pkg.price_per_view_micro) / 2 : null),
    companyFee: pkg.company_fee || (pkg.price_per_view_micro ? microToKwd(pkg.price_per_view_micro) / 2 : null),
    minBudget: pkg.min_budget || 300,
    budgetIncrement: pkg.budget_increment || 100
  };
};

/**
 * Unify purchased package data
 * @param {Object} purchasedPackage - Purchased package object
 * @returns {Object} Unified purchased package
 */
const unifyPurchasedPackageData = (pkg) => {
  if (!pkg) return null;
  
  return {
    ...pkg.toJSON ? pkg.toJSON() : pkg,
    // Ensure both micro and KWD values
    purchasedBudget: pkg.budget_micro ? microToKwd(pkg.budget_micro) : pkg.purchased_budget,
    budgetMicro: pkg.budget_micro || (pkg.purchased_budget ? kwdToMicro(pkg.purchased_budget) : 0),
    remainingBudget: pkg.remaining_micro ? microToKwd(pkg.remaining_micro) : pkg.remaining_budget,
    remainingMicro: pkg.remaining_micro || (pkg.remaining_budget ? kwdToMicro(pkg.remaining_budget) : 0),
    usedBudget: pkg.used_micro ? microToKwd(pkg.used_micro) : pkg.used_budget,
    usedMicro: pkg.used_micro || (pkg.used_budget ? kwdToMicro(pkg.used_budget) : 0)
  };
};

/**
 * Unify wallet data
 * @param {Object} wallet - Wallet object
 * @returns {Object} Unified wallet data
 */
const unifyWalletData = (wallet) => {
  if (!wallet) return null;
  
  return {
    ...wallet.toJSON ? wallet.toJSON() : wallet,
    balance: wallet.balance_micro ? microToKwd(wallet.balance_micro) : wallet.balance,
    balanceMicro: wallet.balance_micro || (wallet.balance ? kwdToMicro(wallet.balance) : 0),
    heldBalance: wallet.held_micro ? microToKwd(wallet.held_micro) : (wallet.held_balance || 0),
    heldMicro: wallet.held_micro || (wallet.held_balance ? kwdToMicro(wallet.held_balance) : 0),
    availableBalance: wallet.balance_micro && wallet.held_micro ? 
      microToKwd(wallet.balance_micro - wallet.held_micro) : 
      (wallet.balance || 0)
  };
};

/**
 * Unify ad data
 * @param {Object} ad - Ad object
 * @returns {Object} Unified ad data
 */
const unifyAdData = (ad) => {
  if (!ad) return null;
  
  return {
    ...ad.toJSON ? ad.toJSON() : ad,
    budget: ad.budget || 0,
    remainingBudget: ad.remaining_budget || 0,
    spent: ad.spent || 0,
    views: ad.views || 0,
    // Ensure status is consistent
    status: ad.status || 'draft',
    isActive: ad.is_active !== undefined ? ad.is_active : true
  };
};

/**
 * Unify transaction data
 * @param {Object} transaction - Transaction object
 * @returns {Object} Unified transaction data
 */
const unifyTransactionData = (tx) => {
  if (!tx) return null;
  
  return {
    ...tx.toJSON ? tx.toJSON() : tx,
    amount: tx.amount_micro ? microToKwd(tx.amount_micro) : tx.amount,
    amountMicro: tx.amount_micro || (tx.amount ? kwdToMicro(tx.amount) : 0),
    // Ensure consistent status values
    status: tx.status || 'pending',
    type: tx.type || 'unknown'
  };
};

module.exports = {
  microToKwd,
  kwdToMicro,
  unifyPackageData,
  unifyPurchasedPackageData,
  unifyWalletData,
  unifyAdData,
  unifyTransactionData,
  MICRO_UNIT_DIVISOR
};
