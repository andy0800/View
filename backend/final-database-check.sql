-- =====================================================
-- FINAL CRITICAL DATABASE VERIFICATION SCRIPT
-- Comprehensive check of all fixes and schema alignment
-- =====================================================

-- 1. DATABASE CONNECTION VERIFICATION
SELECT '=== DATABASE CONNECTION TEST ===' as test;
SELECT current_database(), current_user, version();

-- 2. CHECK ALL TABLES EXIST
SELECT '=== TABLE EXISTENCE CHECK ===' as test;
SELECT 
    table_name,
    CASE 
        WHEN table_name IN ('users', 'purchased_packages', 'advertiser_packages', 'ads', 'view_events', 'transactions', 'wallets', 'sections', 'sessions', 'otp_codes', 'notifications', 'admin_settings', 'company_wallets', 'withdrawals', 'comments', 'comment_likes', 'ad_appeals', 'ad_verification_history', 'Videos') 
        THEN '✅ REQUIRED'
        ELSE '⚠️ OPTIONAL'
    END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- 3. CHECK PURCHASED_PACKAGES TABLE STRUCTURE
SELECT '=== PURCHASED_PACKAGES TABLE STRUCTURE ===' as test;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'purchased_packages' 
ORDER BY ordinal_position;

-- 4. CHECK FOREIGN KEY CONSTRAINTS
SELECT '=== FOREIGN KEY CONSTRAINTS ===' as test;
SELECT 
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    tc.constraint_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_schema = 'public'
ORDER BY tc.table_name, kcu.column_name;

-- 5. CHECK INDEXES
SELECT '=== INDEXES CHECK ===' as test;
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- 6. CHECK DATA COUNTS
SELECT '=== DATA COUNTS ===' as test;
SELECT 'users' as table_name, COUNT(*) as record_count FROM users
UNION ALL
SELECT 'advertiser_packages', COUNT(*) FROM advertiser_packages
UNION ALL
SELECT 'purchased_packages', COUNT(*) FROM purchased_packages
UNION ALL
SELECT 'ads', COUNT(*) FROM ads
UNION ALL
SELECT 'view_events', COUNT(*) FROM view_events
UNION ALL
SELECT 'transactions', COUNT(*) FROM transactions
UNION ALL
SELECT 'wallets', COUNT(*) FROM wallets
UNION ALL
SELECT 'sections', COUNT(*) FROM sections
UNION ALL
SELECT 'sessions', COUNT(*) FROM sessions
UNION ALL
SELECT 'admin_settings', COUNT(*) FROM admin_settings;

-- 7. TEST THE EXACT QUERY THAT WAS FAILING
SELECT '=== TEST FAILING QUERY ===' as test;
SELECT 
    pp.id,
    pp.advertiser_id,
    pp.status,
    pp.remaining_micro,
    ap.name as package_name,
    ap.id as package_id
FROM purchased_packages pp
LEFT JOIN advertiser_packages ap ON pp.package_id = ap.id
WHERE pp.advertiser_id = '00000000-0000-0000-0000-000000000001'
    AND pp.status = 'active'
    AND pp.remaining_micro > 0
ORDER BY pp.purchased_at ASC
LIMIT 5;

-- 8. CHECK ADMIN USER
SELECT '=== ADMIN USER CHECK ===' as test;
SELECT 
    id,
    role,
    name,
    is_active,
    created_at
FROM users 
WHERE id = '00000000-0000-0000-0000-000000000000' 
    OR role = 'admin'
ORDER BY created_at;

-- 9. CHECK CONSTRAINT VALIDATION
SELECT '=== CONSTRAINT VALIDATION ===' as test;
SELECT 
    constraint_name,
    table_name,
    constraint_type
FROM information_schema.table_constraints 
WHERE table_schema = 'public' 
    AND constraint_type IN ('CHECK', 'FOREIGN KEY', 'UNIQUE', 'PRIMARY KEY')
ORDER BY table_name, constraint_type;

-- 10. FINAL VERIFICATION SUMMARY
SELECT '=== FINAL VERIFICATION SUMMARY ===' as test;
SELECT 
    'Total Tables' as metric,
    COUNT(*)::text as value
FROM information_schema.tables 
WHERE table_schema = 'public'
UNION ALL
SELECT 
    'Foreign Keys',
    COUNT(*)::text
FROM information_schema.table_constraints 
WHERE constraint_type = 'FOREIGN KEY' 
    AND table_schema = 'public'
UNION ALL
SELECT 
    'Indexes',
    COUNT(*)::text
FROM pg_indexes 
WHERE schemaname = 'public'
UNION ALL
SELECT 
    'Total Records',
    (SELECT SUM(cnt) FROM (
        SELECT COUNT(*) as cnt FROM users
        UNION ALL SELECT COUNT(*) FROM advertiser_packages
        UNION ALL SELECT COUNT(*) FROM purchased_packages
        UNION ALL SELECT COUNT(*) FROM ads
        UNION ALL SELECT COUNT(*) FROM view_events
        UNION ALL SELECT COUNT(*) FROM transactions
        UNION ALL SELECT COUNT(*) FROM wallets
        UNION ALL SELECT COUNT(*) FROM sections
        UNION ALL SELECT COUNT(*) FROM sessions
        UNION ALL SELECT COUNT(*) FROM admin_settings
    ) t)::text;

-- =====================================================
-- VERIFICATION COMPLETE
-- =====================================================
