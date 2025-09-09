// backend/src/utils/roleUtils.js
'use strict';

/**
 * Role-based access control utilities
 * Ensures proper table access based on user roles
 */

const ROLE_PERMISSIONS = {
  viewer: {
    // Tables viewers can access
    tables: [
      'users',           // Own profile
      'wallets',         // Own wallet
      'view_events',     // Own view history
      'withdrawals',     // Own withdrawal requests
      'comments',        // Comment on ads
      'comment_likes',   // Like comments
      'sessions',        // Own sessions
      'otp_codes',       // Phone verification
      'ads',             // View ads (read-only)
      'advertiser_packages' // View packages (read-only)
    ],
    // Fields viewers can access
    userFields: [
      'id', 'name', 'phone', 'civil_id', 'civil_front_key', 'civil_back_key',
      'kyc_status', 'is_active', 'verified_at', 'created_at', 'updated_at'
    ],
    // Actions viewers can perform
    actions: [
      'view_ads',
      'earn_points',
      'withdraw_money',
      'comment_on_ads',
      'like_comments',
      'update_profile',
      'request_withdrawal'
    ]
  },
  
  advertiser: {
    // Tables advertisers can access
    tables: [
      'users',                    // Own profile
      'wallets',                  // Own wallet
      'advertiser_packages',      // View packages
      'purchased_packages',       // Own purchased packages
      'ads',                      // Own ads
      'transactions',             // Own transactions
      'view_events',              // Ad view history
      'withdrawals',              // Own withdrawal requests
      'ad_appeals',               // Own appeals
      'sessions',                 // Own sessions
      'otp_codes',                // Phone verification
      'comments',                 // Comments on own ads
      'comment_likes'             // Like comments
    ],
    // Fields advertisers can access
    userFields: [
      'id', 'name', 'phone', 'company_name', 'license_number', 'signatory_name',
      'license_doc_key', 'kyc_status', 'is_active', 'verified_at', 'created_at', 'updated_at'
    ],
    // Actions advertisers can perform
    actions: [
      'create_ads',
      'manage_ads',
      'buy_packages',
      'manage_credit',
      'view_analytics',
      'appeal_rejections',
      'update_profile',
      'request_withdrawal'
    ]
  },
  
  admin: {
    // Tables admins can access (all tables)
    tables: [
      'users', 'wallets', 'advertiser_packages', 'purchased_packages', 'ads',
      'transactions', 'view_events', 'withdrawals', 'ad_appeals', 'ad_verification_history',
      'sessions', 'otp_codes', 'notifications', 'comments', 'comment_likes',
      'company_wallets', 'sections'
    ],
    // Fields admins can access (all fields)
    userFields: '*',
    // Actions admins can perform (all actions)
    actions: '*'
  }
};

/**
 * Check if a user role can access a specific table
 * @param {string} role - User role
 * @param {string} table - Table name
 * @returns {boolean}
 */
function canAccessTable(role, table) {
  if (!ROLE_PERMISSIONS[role]) {
    return false;
  }
  
  if (ROLE_PERMISSIONS[role].tables === '*') {
    return true;
  }
  
  return ROLE_PERMISSIONS[role].tables.includes(table);
}

/**
 * Check if a user role can perform a specific action
 * @param {string} role - User role
 * @param {string} action - Action name
 * @returns {boolean}
 */
function canPerformAction(role, action) {
  if (!ROLE_PERMISSIONS[role]) {
    return false;
  }
  
  if (ROLE_PERMISSIONS[role].actions === '*') {
    return true;
  }
  
  return ROLE_PERMISSIONS[role].actions.includes(action);
}

/**
 * Get allowed fields for a user role
 * @param {string} role - User role
 * @returns {Array|string} Allowed fields
 */
function getAllowedFields(role) {
  if (!ROLE_PERMISSIONS[role]) {
    return [];
  }
  
  return ROLE_PERMISSIONS[role].userFields;
}

/**
 * Filter user data based on role permissions
 * @param {Object} user - User object
 * @param {string} role - User role
 * @returns {Object} Filtered user object
 */
function filterUserData(user, role) {
  if (!user || !role) {
    return user;
  }
  
  const allowedFields = getAllowedFields(role);
  
  if (allowedFields === '*') {
    return user;
  }
  
  const filteredUser = {};
  allowedFields.forEach(field => {
    if (user.hasOwnProperty(field)) {
      filteredUser[field] = user[field];
    }
  });
  
  return filteredUser;
}

/**
 * Get role-specific table associations
 * @param {string} role - User role
 * @returns {Array} Array of association objects
 */
function getRoleAssociations(role) {
  const associations = {
    viewer: [
      { model: 'Wallet', as: 'wallet' },
      { model: 'ViewEvent', as: 'viewEvents' },
      { model: 'Withdrawal', as: 'withdrawals' },
      { model: 'Comment', as: 'comments' },
      { model: 'CommentLike', as: 'commentLikes' }
    ],
    advertiser: [
      { model: 'Wallet', as: 'wallet' },
      { model: 'Ad', as: 'ads' },
      { model: 'PurchasedPackage', as: 'purchasedPackages' },
      { model: 'Transaction', as: 'transactions' },
      { model: 'ViewEvent', as: 'viewEvents' },
      { model: 'Withdrawal', as: 'withdrawals' },
      { model: 'AdAppeal', as: 'adAppeals' },
      { model: 'Comment', as: 'comments' },
      { model: 'CommentLike', as: 'commentLikes' }
    ],
    admin: [
      { model: 'Wallet', as: 'wallet' },
      { model: 'Ad', as: 'ads' },
      { model: 'PurchasedPackage', as: 'purchasedPackages' },
      { model: 'Transaction', as: 'transactions' },
      { model: 'ViewEvent', as: 'viewEvents' },
      { model: 'Withdrawal', as: 'withdrawals' },
      { model: 'AdAppeal', as: 'adAppeals' },
      { model: 'Comment', as: 'comments' },
      { model: 'CommentLike', as: 'commentLikes' },
      { model: 'Notification', as: 'notifications' }
    ]
  };
  
  return associations[role] || [];
}

/**
 * Validate role-specific requirements
 * @param {Object} userData - User data to validate
 * @param {string} role - User role
 * @returns {Object} Validation result
 */
function validateRoleRequirements(userData, role) {
  const validation = {
    isValid: true,
    errors: [],
    warnings: []
  };
  
  if (role === 'viewer') {
    const requiredFields = ['name', 'phone', 'civil_id', 'civil_front_key', 'civil_back_key'];
    requiredFields.forEach(field => {
      if (!userData[field]) {
        validation.isValid = false;
        validation.errors.push(`${field} is required for viewers`);
      }
    });
  } else if (role === 'advertiser') {
    const requiredFields = ['name', 'phone', 'company_name', 'license_number', 'signatory_name', 'license_doc_key'];
    requiredFields.forEach(field => {
      if (!userData[field]) {
        validation.isValid = false;
        validation.errors.push(`${field} is required for advertisers`);
      }
    });
  }
  
  return validation;
}

module.exports = {
  ROLE_PERMISSIONS,
  canAccessTable,
  canPerformAction,
  getAllowedFields,
  filterUserData,
  getRoleAssociations,
  validateRoleRequirements
};
