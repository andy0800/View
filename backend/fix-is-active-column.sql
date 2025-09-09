-- Fix missing columns in users table
-- This script adds the missing columns to the users table

-- Check if columns exist, if not add them
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
    
    -- Check if the verified_at column exists
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'verified_at'
        AND table_schema = 'public'
    ) THEN
        -- Add the verified_at column
        ALTER TABLE users ADD COLUMN verified_at TIMESTAMPTZ;
        
        -- Add a comment to the column
        COMMENT ON COLUMN users.verified_at IS 'When user was verified';
        
        RAISE NOTICE 'verified_at column added to users table';
    ELSE
        RAISE NOTICE 'verified_at column already exists in users table';
    END IF;
    
    -- Check if the verified_by column exists
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'verified_by'
        AND table_schema = 'public'
    ) THEN
        -- Add the verified_by column
        ALTER TABLE users ADD COLUMN verified_by UUID REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL;
        
        -- Add a comment to the column
        COMMENT ON COLUMN users.verified_by IS 'Admin who verified the user';
        
        RAISE NOTICE 'verified_by column added to users table';
    ELSE
        RAISE NOTICE 'verified_by column already exists in users table';
    END IF;
END $$;
