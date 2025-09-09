-- Fix missing is_active column in users table
-- This script adds the missing is_active column to the users table

-- Check if column exists, if not add it
DO $$
BEGIN
    -- Check if the is_active column exists
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'is_active'
        AND table_schema = 'public'
    ) THEN
        -- Add the is_active column
        ALTER TABLE users ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT true;
        
        -- Add a comment to the column
        COMMENT ON COLUMN users.is_active IS 'Account status - whether user is active';
        
        RAISE NOTICE 'is_active column added to users table';
    ELSE
        RAISE NOTICE 'is_active column already exists in users table';
    END IF;
END $$;
