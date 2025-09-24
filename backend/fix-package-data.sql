-- Fix advertiser_packages data to use micro-unit fields
-- This script updates existing data to match the new schema

-- First, check if micro-unit columns exist, if not add them
DO $$ 
BEGIN
    -- Add price_per_view_micro column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'advertiser_packages' 
                   AND column_name = 'price_per_view_micro') THEN
        ALTER TABLE advertiser_packages 
        ADD COLUMN price_per_view_micro BIGINT DEFAULT 10000;
    END IF;
    
    -- Add min_budget_micro column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'advertiser_packages' 
                   AND column_name = 'min_budget_micro') THEN
        ALTER TABLE advertiser_packages 
        ADD COLUMN min_budget_micro BIGINT DEFAULT 300000000;
    END IF;
    
    -- Add budget_increment_micro column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'advertiser_packages' 
                   AND column_name = 'budget_increment_micro') THEN
        ALTER TABLE advertiser_packages 
        ADD COLUMN budget_increment_micro BIGINT DEFAULT 100000000;
    END IF;
END $$;

-- Update existing packages with proper micro-unit values
UPDATE advertiser_packages 
SET 
    price_per_view_micro = CASE 
        WHEN name = 'Basic Package' THEN 10000      -- 0.010 KWD
        WHEN name = 'Standard Package' THEN 14000   -- 0.014 KWD
        WHEN name = 'Premium Package' THEN 16000    -- 0.016 KWD
        WHEN name = 'Extended Package' THEN 24000   -- 0.024 KWD
        ELSE 10000
    END,
    min_budget_micro = 300000000,  -- 300 KWD
    budget_increment_micro = 100000000,  -- 100 KWD
    description = CASE 
        WHEN name = 'Basic Package' THEN '10-second video ads with maximum engagement'
        WHEN name = 'Standard Package' THEN '15-second video ads with enhanced visibility'
        WHEN name = 'Premium Package' THEN '20-second video ads with premium placement'
        WHEN name = 'Extended Package' THEN '30-second video ads with extended reach'
        ELSE description
    END
WHERE is_active = true;

-- Verify the update
SELECT 
    id,
    name,
    duration,
    price_per_view_micro,
    min_budget_micro,
    budget_increment_micro,
    description,
    is_active
FROM advertiser_packages 
ORDER BY id;
