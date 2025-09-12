-- =====================================================
-- FIX PURCHASED_PACKAGES SCHEMA MISMATCH
-- Resolves the "column does not exist" error
-- =====================================================

-- 1. ADD MISSING ADVERTISER_ID COLUMN
-- Add advertiser_id column to purchased_packages table
ALTER TABLE purchased_packages 
ADD COLUMN IF NOT EXISTS advertiser_id UUID;

-- 2. POPULATE ADVERTISER_ID FROM USER_ID
-- Update existing records to set advertiser_id = user_id
-- (assuming all users in purchased_packages are advertisers)
UPDATE purchased_packages 
SET advertiser_id = user_id 
WHERE advertiser_id IS NULL;

-- 3. ADD FOREIGN KEY CONSTRAINT
-- Add foreign key constraint for advertiser_id
ALTER TABLE purchased_packages 
ADD CONSTRAINT fk_purchased_packages_advertiser_id 
FOREIGN KEY (advertiser_id) REFERENCES users(id)
ON UPDATE CASCADE ON DELETE CASCADE;

-- 4. ADD INDEX FOR PERFORMANCE
-- Add index for advertiser_id queries
CREATE INDEX IF NOT EXISTS idx_purchased_packages_advertiser_id 
ON purchased_packages(advertiser_id);

-- 5. ADD COMPOSITE INDEX FOR COMMON QUERIES
-- Add composite index for status + remaining_budget_micro queries
CREATE INDEX IF NOT EXISTS idx_purchased_packages_status_remaining 
ON purchased_packages(status, remaining_budget_micro);

-- 6. ADD INDEX FOR REMAINING_MICRO QUERIES
-- Add index for remaining_micro field (if it exists)
CREATE INDEX IF NOT EXISTS idx_purchased_packages_remaining_micro 
ON purchased_packages(remaining_micro) 
WHERE remaining_micro IS NOT NULL;

-- 7. VERIFY SCHEMA CONSISTENCY
-- Check that all required columns exist
DO $$
DECLARE
    missing_columns text[] := ARRAY[]::text[];
    col_name text;
    required_columns text[] := ARRAY[
        'id', 'user_id', 'advertiser_id', 'package_id', 
        'total_budget_micro', 'remaining_budget_micro', 
        'estimated_views', 'actual_views', 'status', 
        'purchased_at', 'expires_at', 'created_at', 'updated_at'
    ];
BEGIN
    -- Check for missing columns
    FOREACH col_name IN ARRAY required_columns
    LOOP
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'purchased_packages' 
            AND column_name = col_name
        ) THEN
            missing_columns := array_append(missing_columns, col_name);
        END IF;
    END LOOP;
    
    -- Report results
    IF array_length(missing_columns, 1) > 0 THEN
        RAISE NOTICE 'Missing columns: %', array_to_string(missing_columns, ', ');
    ELSE
        RAISE NOTICE 'All required columns exist in purchased_packages table';
    END IF;
END $$;

-- 8. VERIFY DATA INTEGRITY
-- Check that advertiser_id is properly populated
SELECT 
    COUNT(*) as total_records,
    COUNT(advertiser_id) as records_with_advertiser_id,
    COUNT(*) - COUNT(advertiser_id) as records_missing_advertiser_id
FROM purchased_packages;

-- 9. TEST QUERY THAT WAS FAILING
-- Test the query that was causing the error
SELECT 
    pp.id, 
    pp.user_id, 
    pp.advertiser_id,
    pp.package_id, 
    pp.total_budget_micro, 
    pp.remaining_budget_micro, 
    pp.estimated_views, 
    pp.actual_views, 
    pp.status, 
    pp.purchased_at, 
    pp.expires_at,
    ap.name as package_name,
    ap.duration as package_duration,
    ap.price_per_view_micro
FROM purchased_packages pp
LEFT OUTER JOIN advertiser_packages ap ON pp.package_id = ap.id
WHERE pp.advertiser_id = 'a29b8636-d00f-49b4-ba5c-fde5a394af16' 
AND pp.status = 'active' 
AND pp.remaining_budget_micro > 0
ORDER BY pp.purchased_at ASC
LIMIT 5;

-- =====================================================
-- SCHEMA FIX COMPLETED
-- =====================================================
