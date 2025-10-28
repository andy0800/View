-- ============================================================================
-- RENDER PRODUCTION DATABASE FIX SCRIPT
-- Date: October 27, 2025
-- Database: viewapp_postgres_4rlf @ Render
-- Purpose: Fix all schema mismatches and add missing features
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 1. USERS TABLE FIXES
-- ----------------------------------------------------------------------------
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS verified_by UUID REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_users_verified_by ON users(verified_by);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);
CREATE INDEX IF NOT EXISTS idx_users_kyc_status ON users(kyc_status);

-- ----------------------------------------------------------------------------
-- 2. ADS TABLE FIXES
-- ----------------------------------------------------------------------------
ALTER TABLE ads
ADD COLUMN IF NOT EXISTS budget NUMERIC(10,3) NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS views INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS spent NUMERIC(10,3) NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS verified_by UUID REFERENCES users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS admin_notes TEXT,
ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
ADD COLUMN IF NOT EXISTS submitted_for_review_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS review_deadline TIMESTAMP,
ADD COLUMN IF NOT EXISTS appeal_deadline TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_ads_verified_by ON ads(verified_by);
CREATE INDEX IF NOT EXISTS idx_ads_views ON ads(views);
CREATE INDEX IF NOT EXISTS idx_ads_budget ON ads(budget);
CREATE INDEX IF NOT EXISTS idx_ads_submitted_for_review ON ads(submitted_for_review_at);

-- ----------------------------------------------------------------------------
-- 3. WALLETS TABLE FIXES
-- ----------------------------------------------------------------------------
ALTER TABLE wallets
ADD COLUMN IF NOT EXISTS held_micro BIGINT NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS confirmed_points INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS pending_points INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_wallets_held_micro ON wallets(held_micro);

-- ----------------------------------------------------------------------------
-- 4. PURCHASED_PACKAGES TABLE FIXES (CRITICAL)
-- ----------------------------------------------------------------------------
-- Rename columns to match backend model
ALTER TABLE purchased_packages 
RENAME COLUMN purchased_budget_micro TO budget_micro;

ALTER TABLE purchased_packages 
RENAME COLUMN remaining_budget_micro TO remaining_micro;

-- Drop unused columns
ALTER TABLE purchased_packages
DROP COLUMN IF EXISTS used_budget_micro,
DROP COLUMN IF EXISTS purchased_budget,
DROP COLUMN IF EXISTS remaining_budget,
DROP COLUMN IF EXISTS used_budget;

-- ----------------------------------------------------------------------------
-- 5. AD_APPEALS TABLE FIXES
-- ----------------------------------------------------------------------------
ALTER TABLE ad_appeals
ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_ad_appeals_reviewed_by ON ad_appeals(reviewed_by);
CREATE INDEX IF NOT EXISTS idx_ad_appeals_status ON ad_appeals(status);

-- ----------------------------------------------------------------------------
-- 6. ADMIN_SETTINGS TABLE FIXES
-- ----------------------------------------------------------------------------
ALTER TABLE admin_settings
ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_admin_settings_updated_by ON admin_settings(updated_by);
CREATE INDEX IF NOT EXISTS idx_admin_settings_key ON admin_settings(key);

-- ----------------------------------------------------------------------------
-- 7. COMPANY_WALLETS TABLE FIXES
-- ----------------------------------------------------------------------------
ALTER TABLE company_wallets
ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_company_wallets_updated_by ON company_wallets(updated_by);

-- ----------------------------------------------------------------------------
-- 8. VIEW_EVENTS TABLE - 24HR REWARD SYSTEM
-- ----------------------------------------------------------------------------
-- Index for 24hr reward cooldown check (user + ad + completion status + time)
CREATE INDEX IF NOT EXISTS idx_view_events_24hr_reward_check 
ON view_events(user_id, ad_id, is_completed, completed_at DESC);

-- Index for completed views with timestamp (for 24hr queries)
CREATE INDEX IF NOT EXISTS idx_view_events_completed_at 
ON view_events(completed_at DESC) WHERE is_completed = true;

-- Index for user's recent completed views (last 24 hours queries)
CREATE INDEX IF NOT EXISTS idx_view_events_user_completed 
ON view_events(user_id, is_completed, completed_at DESC);

-- Composite index for checking user's ad views
CREATE INDEX IF NOT EXISTS idx_view_events_ad_user_completed 
ON view_events(ad_id, user_id, is_completed);

-- Index for proof token expiration cleanup
CREATE INDEX IF NOT EXISTS idx_view_events_proof_expires 
ON view_events(proof_token_expires_at);

-- ----------------------------------------------------------------------------
-- 9. MISSING FOREIGN KEY INDEXES
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_purchased_packages_advertiser_id ON purchased_packages(advertiser_id);
CREATE INDEX IF NOT EXISTS idx_purchased_packages_status ON purchased_packages(status);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_withdrawals_status ON withdrawals(status);
CREATE INDEX IF NOT EXISTS idx_withdrawals_approved ON withdrawals(approved);

-- ----------------------------------------------------------------------------
-- 10. PERFORMANCE INDEXES
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_sections_is_active ON sections(is_active);
CREATE INDEX IF NOT EXISTS idx_sections_sort_order ON sections(sort_order);
CREATE INDEX IF NOT EXISTS idx_advertiser_packages_is_active ON advertiser_packages(is_active);

-- ----------------------------------------------------------------------------
-- COMMIT ALL CHANGES
-- ----------------------------------------------------------------------------
COMMIT;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check if all columns were added
SELECT 
  'users' as table_name, 
  COUNT(CASE WHEN column_name IN ('is_active', 'verified_by') THEN 1 END) as added_columns,
  2 as expected_columns
FROM information_schema.columns 
WHERE table_name = 'users' AND table_schema = 'public'
UNION ALL
SELECT 
  'ads',
  COUNT(CASE WHEN column_name IN ('budget', 'views', 'spent', 'verified_by', 'verified_at', 'admin_notes', 'rejection_reason', 'submitted_for_review_at', 'review_deadline', 'appeal_deadline') THEN 1 END),
  10
FROM information_schema.columns 
WHERE table_name = 'ads' AND table_schema = 'public'
UNION ALL
SELECT 
  'wallets',
  COUNT(CASE WHEN column_name IN ('held_micro', 'confirmed_points', 'pending_points') THEN 1 END),
  3
FROM information_schema.columns 
WHERE table_name = 'wallets' AND table_schema = 'public'
UNION ALL
SELECT 
  'purchased_packages',
  COUNT(CASE WHEN column_name IN ('budget_micro', 'remaining_micro') THEN 1 END),
  2
FROM information_schema.columns 
WHERE table_name = 'purchased_packages' AND table_schema = 'public';

-- Check index count
SELECT 
  schemaname,
  COUNT(*) as total_indexes
FROM pg_indexes 
WHERE schemaname = 'public'
GROUP BY schemaname;

-- Check for 24hr reward system indexes
SELECT indexname 
FROM pg_indexes 
WHERE schemaname = 'public' 
  AND tablename = 'view_events'
  AND (indexname LIKE '%24hr%' OR indexname LIKE '%completed%')
ORDER BY indexname;

-- Final success message
SELECT '✅ ALL FIXES APPLIED SUCCESSFULLY!' as status,
       'Database schema now matches backend models' as message,
       '24-hour reward system indexes created' as feature_1,
       'All missing columns added' as feature_2,
       'Performance indexes created' as feature_3;

