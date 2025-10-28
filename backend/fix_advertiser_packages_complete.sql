-- ============================================================================
-- FIX ADVERTISER PACKAGES - COMPLETE SCHEMA AND DATA ALIGNMENT
-- ============================================================================
-- This script aligns the advertiser_packages table with the code expectations
-- ============================================================================

BEGIN;

-- ============================================================================
-- STEP 1: ADD MISSING COLUMNS
-- ============================================================================

-- Add min_budget_micro column (300 KWD minimum)
ALTER TABLE advertiser_packages 
ADD COLUMN IF NOT EXISTS min_budget_micro BIGINT NOT NULL DEFAULT 300000000;

COMMENT ON COLUMN advertiser_packages.min_budget_micro IS 'Minimum budget in micro units (300 KWD = 300,000,000 micro)';

-- Add budget_increment_micro column (100 KWD increments)
ALTER TABLE advertiser_packages 
ADD COLUMN IF NOT EXISTS budget_increment_micro BIGINT NOT NULL DEFAULT 100000000;

COMMENT ON COLUMN advertiser_packages.budget_increment_micro IS 'Budget increment in micro units (100 KWD = 100,000,000 micro)';

-- Add description column
ALTER TABLE advertiser_packages 
ADD COLUMN IF NOT EXISTS description TEXT;

COMMENT ON COLUMN advertiser_packages.description IS 'Package description for display';

-- ============================================================================
-- STEP 2: DROP UNNECESSARY COLUMNS (NOT IN MODEL)
-- ============================================================================

-- These columns exist in database but not in the model
-- They are redundant since we calculate these values dynamically
ALTER TABLE advertiser_packages 
DROP COLUMN IF EXISTS viewer_reward_percentage CASCADE;

ALTER TABLE advertiser_packages 
DROP COLUMN IF EXISTS company_share_percentage CASCADE;

ALTER TABLE advertiser_packages 
DROP COLUMN IF EXISTS estimated_views CASCADE;

-- ============================================================================
-- STEP 3: UPDATE PACKAGE DATA TO MATCH CODE EXPECTATIONS
-- ============================================================================

-- Update P10 (10 Second Package)
UPDATE advertiser_packages 
SET 
  name = '10 Second Package',
  duration = 10,
  price_per_view_micro = 10000, -- 0.010 KWD = 10 fils
  min_budget_micro = 300000000,  -- 300 KWD
  budget_increment_micro = 100000000, -- 100 KWD
  description = '10-second video ads with 10 fils per viewer',
  is_active = true,
  updated_at = NOW()
WHERE id = 1;

-- Update P15 (15 Second Package) - CRITICAL FIX: 15000 -> 13000
UPDATE advertiser_packages 
SET 
  name = '15 Second Package',
  duration = 15,
  price_per_view_micro = 13000, -- 0.013 KWD = 13 fils (NOT 15 fils!)
  min_budget_micro = 300000000,  -- 300 KWD
  budget_increment_micro = 100000000, -- 100 KWD
  description = '15-second video ads with 13 fils per viewer',
  is_active = true,
  updated_at = NOW()
WHERE id = 2;

-- Update P20 (20 Second Package)
UPDATE advertiser_packages 
SET 
  name = '20 Second Package',
  duration = 20,
  price_per_view_micro = 16000, -- 0.016 KWD = 16 fils
  min_budget_micro = 300000000,  -- 300 KWD
  budget_increment_micro = 100000000, -- 100 KWD
  description = '20-second video ads with 16 fils per viewer',
  is_active = true,
  updated_at = NOW()
WHERE id = 3;

-- Update P30 (30 Second Package) - CRITICAL FIX: 30000 -> 24000
UPDATE advertiser_packages 
SET 
  name = '30 Second Package',
  duration = 30,
  price_per_view_micro = 24000, -- 0.024 KWD = 24 fils (NOT 30 fils!)
  min_budget_micro = 300000000,  -- 300 KWD
  budget_increment_micro = 100000000, -- 100 KWD
  description = '30-second video ads with 24 fils per viewer',
  is_active = true,
  updated_at = NOW()
WHERE id = 4;

-- ============================================================================
-- STEP 4: ADD MISSING INDEXES FROM MODEL
-- ============================================================================

-- Index on duration for efficient lookups
CREATE INDEX IF NOT EXISTS idx_advertiser_packages_duration 
ON advertiser_packages(duration);

-- Index on is_active already exists (idx_advertiser_packages_is_active)

-- ============================================================================
-- STEP 5: VERIFY THE CHANGES
-- ============================================================================

-- Display updated packages
SELECT 
  id,
  name,
  duration,
  price_per_view_micro,
  (price_per_view_micro::FLOAT / 1000000) as price_per_view_kwd,
  min_budget_micro,
  (min_budget_micro::FLOAT / 1000000) as min_budget_kwd,
  budget_increment_micro,
  (budget_increment_micro::FLOAT / 1000000) as budget_increment_kwd,
  description,
  is_active
FROM advertiser_packages
ORDER BY id;

-- ============================================================================
-- STEP 6: UPDATE COMMENTS FOR CLARITY
-- ============================================================================

COMMENT ON TABLE advertiser_packages IS 'Advertiser package definitions with micro-unit pricing (1,000,000 micro = 1 KWD)';
COMMENT ON COLUMN advertiser_packages.id IS 'Primary key - package ID';
COMMENT ON COLUMN advertiser_packages.name IS 'Package name (e.g., "10 Second Package")';
COMMENT ON COLUMN advertiser_packages.duration IS 'Video duration in seconds';
COMMENT ON COLUMN advertiser_packages.price_per_view_micro IS 'Price per view in micro units (1,000,000 = 1 KWD). Viewer gets 50%, company gets 50%.';
COMMENT ON COLUMN advertiser_packages.is_active IS 'Whether package is available for purchase';

COMMIT;

-- ============================================================================
-- EXPECTED RESULT:
-- ============================================================================
-- ID | Name               | Duration | Price (micro) | Price (KWD) | Min Budget | Increment
-- ---|--------------------|---------:|--------------:|------------:|-----------:|----------:
--  1 | 10 Second Package  | 10       | 10,000        | 0.010       | 300 KWD    | 100 KWD
--  2 | 15 Second Package  | 15       | 13,000        | 0.013       | 300 KWD    | 100 KWD
--  3 | 20 Second Package  | 20       | 16,000        | 0.016       | 300 KWD    | 100 KWD
--  4 | 30 Second Package  | 30       | 24,000        | 0.024       | 300 KWD    | 100 KWD
--
-- VIEWER REWARD (50/50 split):
-- - P10: 5,000 micro (0.005 KWD) = 5 fils to viewer
-- - P15: 6,500 micro (0.007 KWD) = 7 fils to viewer (rounded from 6.5)
-- - P20: 8,000 micro (0.008 KWD) = 8 fils to viewer
-- - P30: 12,000 micro (0.012 KWD) = 12 fils to viewer
-- ============================================================================

