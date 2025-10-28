-- =============================================================================
-- 24-HOUR REWARD SYSTEM - DATABASE CHANGES
-- =============================================================================
-- This script adds support for recurring 24-hour reward eligibility
-- Users can now earn rewards for the same ad once every 24 hours
-- =============================================================================

-- Connect to the database (this will be done via psql command)
-- \c viewapp_postgres

BEGIN;

-- =============================================================================
-- STEP 1: Add performance index for 24-hour reward lookups
-- =============================================================================
-- This index enables fast queries to find the last completed view for a user+ad
-- Used to determine if 24 hours have passed since last reward

DO $$ 
BEGIN
    -- Check if index already exists before creating
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_view_events_24hr_reward_check'
    ) THEN
        CREATE INDEX idx_view_events_24hr_reward_check 
        ON view_events (user_id, ad_id, is_completed, completed_at DESC)
        WHERE is_completed = true;
        
        RAISE NOTICE '✅ Created index: idx_view_events_24hr_reward_check';
    ELSE
        RAISE NOTICE '⚠️  Index already exists: idx_view_events_24hr_reward_check';
    END IF;
END $$;

-- =============================================================================
-- STEP 2: Verify completed_at column exists and is properly set
-- =============================================================================
-- Ensure all completed view events have a completed_at timestamp

DO $$ 
BEGIN
    -- Check if completed_at column exists
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'view_events' AND column_name = 'completed_at'
    ) THEN
        RAISE NOTICE '✅ Column completed_at exists in view_events';
        
        -- Update any completed views that are missing completed_at timestamp
        UPDATE view_events 
        SET completed_at = viewed_at 
        WHERE is_completed = true 
          AND completed_at IS NULL
          AND viewed_at IS NOT NULL;
        
        RAISE NOTICE '✅ Updated % rows with missing completed_at timestamps', 
                     (SELECT COUNT(*) FROM view_events WHERE is_completed = true AND completed_at IS NOT NULL);
    ELSE
        RAISE EXCEPTION '❌ ERROR: completed_at column does not exist in view_events table';
    END IF;
END $$;

-- =============================================================================
-- STEP 3: Add index for user watch history queries (optimization)
-- =============================================================================
-- Optimizes queries that check recent view history for a user

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_view_events_user_completed_at'
    ) THEN
        CREATE INDEX idx_view_events_user_completed_at 
        ON view_events (user_id, completed_at DESC)
        WHERE is_completed = true;
        
        RAISE NOTICE '✅ Created index: idx_view_events_user_completed_at';
    ELSE
        RAISE NOTICE '⚠️  Index already exists: idx_view_events_user_completed_at';
    END IF;
END $$;

-- =============================================================================
-- STEP 4: Add index for ad-specific view tracking (optimization)
-- =============================================================================
-- Optimizes queries that check view counts per ad

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_view_events_ad_completed'
    ) THEN
        CREATE INDEX idx_view_events_ad_completed 
        ON view_events (ad_id, is_completed, completed_at DESC);
        
        RAISE NOTICE '✅ Created index: idx_view_events_ad_completed';
    ELSE
        RAISE NOTICE '⚠️  Index already exists: idx_view_events_ad_completed';
    END IF;
END $$;

-- =============================================================================
-- STEP 5: Verification Queries
-- =============================================================================

-- Show total view events
DO $$ 
DECLARE
    total_views INTEGER;
    completed_views INTEGER;
    views_with_timestamp INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_views FROM view_events;
    SELECT COUNT(*) INTO completed_views FROM view_events WHERE is_completed = true;
    SELECT COUNT(*) INTO views_with_timestamp FROM view_events WHERE is_completed = true AND completed_at IS NOT NULL;
    
    RAISE NOTICE '📊 Total view events: %', total_views;
    RAISE NOTICE '📊 Completed view events: %', completed_views;
    RAISE NOTICE '📊 Completed views with timestamp: %', views_with_timestamp;
    
    IF views_with_timestamp = completed_views THEN
        RAISE NOTICE '✅ All completed views have timestamps - Ready for 24hr system!';
    ELSE
        RAISE WARNING '⚠️  Some completed views are missing timestamps';
    END IF;
END $$;

-- Show all indexes on view_events table
SELECT 
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'view_events'
ORDER BY indexname;

COMMIT;

-- =============================================================================
-- COMPLETION MESSAGE
-- =============================================================================
DO $$ 
BEGIN
    RAISE NOTICE '=============================================================================';
    RAISE NOTICE '✅ 24-HOUR REWARD SYSTEM - DATABASE CHANGES COMPLETED SUCCESSFULLY';
    RAISE NOTICE '=============================================================================';
    RAISE NOTICE 'Next Steps:';
    RAISE NOTICE '  1. Deploy updated backend code (view_event.js model)';
    RAISE NOTICE '  2. Deploy updated backend code (viewerController.js)';
    RAISE NOTICE '  3. Restart backend server';
    RAISE NOTICE '  4. Test the 24-hour reward functionality';
    RAISE NOTICE '=============================================================================';
END $$;

