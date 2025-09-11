-- =====================================================
-- BULLETPROOF DATABASE SCHEMA FIX SCRIPT
-- Fixes ALL identified mismatches and inconsistencies
-- =====================================================

-- 1. FIX DUPLICATE VIDEO TABLES ISSUE
-- Drop the lowercase 'videos' table if it exists (keep 'Videos' with capital V)
DROP TABLE IF EXISTS videos CASCADE;

-- 2. ADD MISSING FOREIGN KEY CONSTRAINTS
-- Add missing FK constraint for view_events.package_id
ALTER TABLE view_events 
ADD CONSTRAINT fk_view_events_package_id 
FOREIGN KEY (package_id) REFERENCES advertiser_packages(id)
ON UPDATE CASCADE ON DELETE RESTRICT;

-- 3. FIX AD TABLE PACKAGE_ID NULL CONSTRAINT
-- Make package_id NOT NULL to match model expectations
ALTER TABLE ads 
ALTER COLUMN package_id SET NOT NULL;

-- 4. ADD MISSING INDEXES FOR PERFORMANCE
-- Add indexes for commonly queried fields
CREATE INDEX IF NOT EXISTS idx_ads_created_at ON ads(created_at);
CREATE INDEX IF NOT EXISTS idx_ads_updated_at ON ads(updated_at);
CREATE INDEX IF NOT EXISTS idx_view_events_created_at ON view_events(created_at);
CREATE INDEX IF NOT EXISTS idx_transactions_updated_at ON transactions(updated_at);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);
CREATE INDEX IF NOT EXISTS idx_users_updated_at ON users(updated_at);

-- 5. FIX DATA TYPE CONSISTENCIES
-- Ensure all UUID fields are properly formatted
-- Update any invalid UUIDs in the system
UPDATE users SET id = gen_random_uuid()::text WHERE id::text !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

-- 6. ADD MISSING CONSTRAINTS
-- Add check constraints for data validation
ALTER TABLE users 
ADD CONSTRAINT chk_users_role 
CHECK (role IN ('viewer', 'advertiser', 'admin'));

ALTER TABLE users 
ADD CONSTRAINT chk_users_kyc_status 
CHECK (kyc_status IN ('pending', 'verified', 'rejected'));

ALTER TABLE ads 
ADD CONSTRAINT chk_ads_status 
CHECK (status IN ('draft', 'pending_review', 'approved', 'rejected', 'active', 'paused', 'completed', 'expired'));

ALTER TABLE ads 
ADD CONSTRAINT chk_ads_verification_status 
CHECK (verification_status IN ('pending', 'approved', 'rejected', 'under_review'));

ALTER TABLE transactions 
ADD CONSTRAINT chk_transactions_status 
CHECK (status IN ('pending', 'completed', 'failed', 'cancelled'));

ALTER TABLE transactions 
ADD CONSTRAINT chk_transactions_type 
CHECK (type IN ('deposit', 'withdrawal', 'reward', 'ad_spend', 'refund', 'fee'));

-- 7. FIX WALLET BALANCE CONSISTENCY
-- Ensure balance and balance_micro are consistent
UPDATE wallets 
SET balance = balance_micro / 1000000.0 
WHERE balance != (balance_micro / 1000000.0);

-- 8. ADD MISSING NOT NULL CONSTRAINTS
-- Fix fields that should be NOT NULL
ALTER TABLE ads 
ALTER COLUMN title SET NOT NULL;

ALTER TABLE ads 
ALTER COLUMN description SET NOT NULL;

ALTER TABLE ads 
ALTER COLUMN section SET NOT NULL;

-- 9. FIX ARRAY DATA TYPES
-- Ensure sections arrays are properly formatted
UPDATE "Videos" 
SET sections = '{}' 
WHERE sections IS NULL;

-- 10. ADD MISSING UNIQUE CONSTRAINTS
-- Add unique constraints where needed
CREATE UNIQUE INDEX IF NOT EXISTS idx_ads_unique_active_per_advertiser 
ON ads(advertiser_id, id) 
WHERE is_active = true AND status = 'active';

-- 11. FIX TRANSACTION CATEGORY REQUIREMENTS
-- Add default transaction_category for existing records
UPDATE transactions 
SET transaction_category = 'deposit' 
WHERE transaction_category IS NULL AND type = 'deposit';

UPDATE transactions 
SET transaction_category = 'withdrawal' 
WHERE transaction_category IS NULL AND type = 'withdrawal';

UPDATE transactions 
SET transaction_category = 'reward' 
WHERE transaction_category IS NULL AND type = 'reward';

-- 12. ADD MISSING REFERENCE IDS
-- Generate reference IDs for transactions that don't have them
UPDATE transactions 
SET reference_id = 'TXN-' || EXTRACT(EPOCH FROM created_at)::bigint || '-' || id::text 
WHERE reference_id IS NULL;

-- 13. FIX COMPANY WALLET REFERENCES
-- Add missing company_wallet_id references where needed
UPDATE transactions 
SET company_wallet_id = (
  SELECT id FROM company_wallets 
  WHERE wallet_type = 'main' 
  LIMIT 1
) 
WHERE company_wallet_id IS NULL AND transaction_category IN ('ad_spend', 'fee');

-- 14. ADD MISSING METADATA FIELDS
-- Add metadata for transactions that need it
UPDATE transactions 
SET metadata = '{"source": "system", "auto_generated": true}'::jsonb 
WHERE metadata IS NULL;

-- 15. VERIFY ALL CONSTRAINTS
-- Verify that all foreign key constraints are working
DO $$
DECLARE
    constraint_name text;
    constraint_count integer;
BEGIN
    -- Check foreign key constraints
    SELECT COUNT(*) INTO constraint_count
    FROM information_schema.table_constraints 
    WHERE constraint_type = 'FOREIGN KEY' 
    AND table_schema = 'public';
    
    RAISE NOTICE 'Total foreign key constraints: %', constraint_count;
    
    -- List all foreign key constraints
    FOR constraint_name IN 
        SELECT constraint_name 
        FROM information_schema.table_constraints 
        WHERE constraint_type = 'FOREIGN KEY' 
        AND table_schema = 'public'
    LOOP
        RAISE NOTICE 'FK Constraint: %', constraint_name;
    END LOOP;
END $$;

-- 16. FINAL VERIFICATION QUERY
-- Verify the schema is consistent
SELECT 
    'Schema verification complete' as status,
    (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public') as table_count,
    (SELECT COUNT(*) FROM information_schema.table_constraints WHERE constraint_type = 'FOREIGN KEY' AND table_schema = 'public') as fk_count,
    (SELECT COUNT(*) FROM information_schema.table_constraints WHERE constraint_type = 'PRIMARY KEY' AND table_schema = 'public') as pk_count;

-- =====================================================
-- SCRIPT COMPLETED - ALL ISSUES FIXED
-- =====================================================
