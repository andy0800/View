# ============================================================================
# RENDER PRODUCTION DATABASE FIX EXECUTION SCRIPT
# Date: October 27, 2025
# Purpose: Execute all database fixes on Render production
# ============================================================================

param(
    [switch]$BackupOnly,
    [switch]$FixOnly,
    [switch]$VerifyOnly
)

# Render Production Database Connection
$DB_HOST = "dpg-d3vqqb95pdvs73ba8b70-a.oregon-postgres.render.com"
$DB_PORT = "5432"
$DB_NAME = "viewapp_postgres_4rlf"
$DB_USER = "viewapp_postgres_4rlf_user"
$DB_PASS = "kSGkSRibc6kBvHNxZMFen4KYfMgZwIvP"

# Set connection string
$env:PGPASSWORD = $DB_PASS
$CONNECTION_STRING = "sslmode=require host=$DB_HOST port=$DB_PORT dbname=$DB_NAME user=$DB_USER"

Write-Host "`n=============================================" -ForegroundColor Cyan
Write-Host "   RENDER PRODUCTION DATABASE FIX SCRIPT" -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""

# ============================================================================
# STEP 1: BACKUP
# ============================================================================
if (-not $FixOnly -and -not $VerifyOnly) {
    Write-Host "[1/3] Creating backup..." -ForegroundColor Yellow
    $backupFile = ".\backups\render_backup_before_fixes_$(Get-Date -Format 'yyyyMMdd_HHmmss').sql"
    
    try {
        pg_dump -h $DB_HOST `
                -p $DB_PORT `
                -U $DB_USER `
                -d $DB_NAME `
                --no-owner `
                --no-acl `
                > $backupFile
        
        $fileSize = [math]::Round((Get-Item $backupFile).Length / 1KB, 2)
        Write-Host "   ✅ Backup created: $backupFile ($fileSize KB)" -ForegroundColor Green
    }
    catch {
        Write-Host "   ❌ Backup failed: $_" -ForegroundColor Red
        exit 1
    }
}

if ($BackupOnly) {
    Write-Host "`n✅ Backup complete. Exiting." -ForegroundColor Green
    Remove-Item Env:\PGPASSWORD
    exit 0
}

# ============================================================================
# STEP 2: EXECUTE FIXES
# ============================================================================
if (-not $VerifyOnly) {
    Write-Host "`n[2/3] Executing database fixes..." -ForegroundColor Yellow
    
    try {
        psql $CONNECTION_STRING -f .\fix_render_production_database.sql
        Write-Host "   ✅ Database fixes applied successfully" -ForegroundColor Green
    }
    catch {
        Write-Host "   ❌ Fix execution failed: $_" -ForegroundColor Red
        Write-Host "   ⚠️  Restore from backup if needed" -ForegroundColor Yellow
        Remove-Item Env:\PGPASSWORD
        exit 1
    }
}

if ($FixOnly) {
    Write-Host "`n✅ Fixes applied. Exiting." -ForegroundColor Green
    Remove-Item Env:\PGPASSWORD
    exit 0
}

# ============================================================================
# STEP 3: VERIFICATION
# ============================================================================
Write-Host "`n[3/3] Verifying changes..." -ForegroundColor Yellow

try {
    # Check table structure
    Write-Host "`n   Checking table structures..." -ForegroundColor Cyan
    
    # Check users table
    $usersCheck = psql $CONNECTION_STRING -t -c "SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'users' AND column_name IN ('is_active', 'verified_by');"
    if ($usersCheck.Trim() -eq "2") {
        Write-Host "   ✅ Users table: All columns added" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Users table: Missing columns" -ForegroundColor Red
    }
    
    # Check ads table
    $adsCheck = psql $CONNECTION_STRING -t -c "SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'ads' AND column_name IN ('budget', 'views', 'spent', 'verified_by', 'verified_at', 'admin_notes', 'rejection_reason', 'submitted_for_review_at', 'review_deadline', 'appeal_deadline');"
    if ($adsCheck.Trim() -eq "10") {
        Write-Host "   ✅ Ads table: All columns added" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Ads table: Missing columns" -ForegroundColor Red
    }
    
    # Check wallets table
    $walletsCheck = psql $CONNECTION_STRING -t -c "SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'wallets' AND column_name IN ('held_micro', 'confirmed_points', 'pending_points');"
    if ($walletsCheck.Trim() -eq "3") {
        Write-Host "   ✅ Wallets table: All columns added" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Wallets table: Missing columns" -ForegroundColor Red
    }
    
    # Check purchased_packages table
    $packagesCheck = psql $CONNECTION_STRING -t -c "SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'purchased_packages' AND column_name IN ('budget_micro', 'remaining_micro');"
    if ($packagesCheck.Trim() -eq "2") {
        Write-Host "   ✅ Purchased_packages table: Columns renamed correctly" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Purchased_packages table: Column rename failed" -ForegroundColor Red
    }
    
    # Check 24hr reward system indexes
    Write-Host "`n   Checking 24hr reward system..." -ForegroundColor Cyan
    $rewardIndexes = psql $CONNECTION_STRING -t -c "SELECT COUNT(*) FROM pg_indexes WHERE schemaname = 'public' AND tablename = 'view_events' AND (indexname LIKE '%24hr%' OR indexname LIKE '%completed%');"
    Write-Host "   ✅ 24hr reward indexes created: $($rewardIndexes.Trim())" -ForegroundColor Green
    
    # Check total index count
    Write-Host "`n   Checking performance indexes..." -ForegroundColor Cyan
    $totalIndexes = psql $CONNECTION_STRING -t -c "SELECT COUNT(*) FROM pg_indexes WHERE schemaname = 'public';"
    Write-Host "   ✅ Total indexes in database: $($totalIndexes.Trim())" -ForegroundColor Green
    
    Write-Host "`n   ✅ All verifications complete!" -ForegroundColor Green
}
catch {
    Write-Host "   ❌ Verification failed: $_" -ForegroundColor Red
}

# ============================================================================
# CLEANUP
# ============================================================================
Remove-Item Env:\PGPASSWORD

Write-Host "`n=============================================" -ForegroundColor Cyan
Write-Host "              FIX COMPLETE" -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "NEXT STEPS:" -ForegroundColor Yellow
Write-Host "  1. Restart your backend server" -ForegroundColor White
Write-Host "  2. Test critical API endpoints" -ForegroundColor White
Write-Host "  3. Test user registration" -ForegroundColor White
Write-Host "  4. Test ad creation and viewing" -ForegroundColor White
Write-Host "  5. Test 24hr reward system" -ForegroundColor White
Write-Host ""
Write-Host "✅ Database schema now matches backend models!" -ForegroundColor Green
Write-Host ""

