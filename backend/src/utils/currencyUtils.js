// backend/src/utils/currencyUtils.js

/**
 * Currency conversion utilities for KWD (Kuwait Dinar) and fils
 * 
 * Currency System:
 * - 1 KWD = 1000 fils (smallest currency unit)
 * - Database stores amounts in fils (BIGINT)
 * - Frontend displays amounts in KWD
 * - API accepts amounts in KWD
 */

/**
 * Convert KWD to fils for database storage
 * @param {number} kwdAmount - Amount in KWD
 * @returns {number} Amount in fils
 */
function kwdToFils(kwdAmount) {
  if (typeof kwdAmount !== 'number' || isNaN(kwdAmount)) {
    throw new Error('Invalid KWD amount provided');
  }
  return Math.round(kwdAmount * 1000);
}

/**
 * Convert fils to KWD for frontend display
 * @param {number|string|null|undefined} filsAmount - Amount in fils
 * @returns {number} Amount in KWD
 */
function filsToKwd(filsAmount) {
  // Handle null/undefined values safely
  if (filsAmount === null || filsAmount === undefined) {
    return 0;
  }
  
  // Handle string inputs by converting to number
  if (typeof filsAmount === 'string') {
    const parsed = parseFloat(filsAmount);
    if (isNaN(parsed)) {
      console.warn('Invalid string value for fils conversion:', filsAmount);
      return 0;
    }
    filsAmount = parsed;
  }
  
  // Validate number type
  if (typeof filsAmount !== 'number' || isNaN(filsAmount)) {
    console.warn('Invalid fils amount provided:', filsAmount);
    return 0;
  }
  
  return parseFloat((filsAmount / 1000).toFixed(3));
}

/**
 * Format KWD amount for display
 * @param {number} kwdAmount - Amount in KWD
 * @returns {string} Formatted KWD amount
 */
function formatKWD(kwdAmount) {
  if (typeof kwdAmount !== 'number' || isNaN(kwdAmount)) {
    return '0.000 KWD';
  }
  return `${kwdAmount.toFixed(3)} KWD`;
}

/**
 * Format fils amount for display
 * @param {number|null|undefined} filsAmount - Amount in fils
 * @returns {string} Formatted fils amount
 */
function formatFils(filsAmount) {
  if (filsAmount === null || filsAmount === undefined) {
    return '0 fils';
  }
  
  if (typeof filsAmount !== 'number' || isNaN(filsAmount)) {
    return '0 fils';
  }
  
  return `${filsAmount} fils`;
}

/**
 * Validate KWD amount (must be positive and reasonable)
 * @param {number} kwdAmount - Amount in KWD
 * @returns {boolean} True if valid
 */
function validateKWDAmount(kwdAmount) {
  if (typeof kwdAmount !== 'number' || isNaN(kwdAmount)) {
    return false;
  }
  if (kwdAmount <= 0) {
    return false;
  }
  if (kwdAmount > 1000000) { // Max 1 million KWD
    return false;
  }
  return true;
}

/**
 * Validate fils amount (must be positive and reasonable)
 * @param {number|null|undefined} filsAmount - Amount in fils
 * @returns {boolean} True if valid
 */
function validateFilsAmount(filsAmount) {
  if (filsAmount === null || filsAmount === undefined) {
    return false;
  }
  
  if (typeof filsAmount !== 'number' || isNaN(filsAmount)) {
    return false;
  }
  if (filsAmount < 0) {
    return false;
  }
  if (filsAmount > 1000000000) { // Max 1 billion fils (1 million KWD)
    return false;
  }
  return true;
}

/**
 * Convert and validate KWD amount for database storage
 * @param {number} kwdAmount - Amount in KWD
 * @returns {number} Validated amount in fils
 * @throws {Error} If amount is invalid
 */
function validateAndConvertToFils(kwdAmount) {
  if (!validateKWDAmount(kwdAmount)) {
    throw new Error(`Invalid KWD amount: ${kwdAmount}. Must be positive and reasonable.`);
  }
  return kwdToFils(kwdAmount);
}

/**
 * Convert and validate fils amount for frontend display
 * @param {number|null|undefined} filsAmount - Amount in fils
 * @returns {number} Validated amount in KWD
 * @throws {Error} If amount is invalid
 */
function validateAndConvertToKWD(filsAmount) {
  if (!validateFilsAmount(filsAmount)) {
    throw new Error(`Invalid fils amount: ${filsAmount}. Must be non-negative and reasonable.`);
  }
  return filsToKwd(filsAmount);
}

module.exports = {
  kwdToFils,
  filsToKwd,
  formatKWD,
  formatFils,
  validateKWDAmount,
  validateFilsAmount,
  validateAndConvertToFils,
  validateAndConvertToKWD
};
