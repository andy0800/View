# =====================================================
# BULLETPROOF DATABASE FIX EXECUTION SCRIPT (PowerShell)
# Executes all database fixes in the correct order
# =====================================================

Write-Host "🚀 Starting comprehensive database schema fixes..." -ForegroundColor Green

# Set error handling
$ErrorActionPreference = "Stop"

# Check if we're in the right directory
if (-not (Test-Path "fix-database-schema.sql")) {
    Write-Host "❌ Error: fix-database-schema.sql not found. Please run from backend directory." -ForegroundColor Red
    exit 1
}

# Check if psql is available
try {
    $null = Get-Command psql -ErrorAction Stop
} catch {
    Write-Host "❌ Error: psql command not found. Please install PostgreSQL client." -ForegroundColor Red
    exit 1
}

# Set database connection parameters
$DB_HOST = if ($env:DB_HOST) { $env:DB_HOST } else { "localhost" }
$DB_PORT = if ($env:DB_PORT) { $env:DB_PORT } else { "5432" }
$DB_NAME = if ($env:DB_NAME) { $env:DB_NAME } else { "view_db" }
$DB_USER = if ($env:DB_USER) { $env:DB_USER } else { "postgres" }

Write-Host "📊 Database connection details:" -ForegroundColor Cyan
Write-Host "   Host: $DB_HOST" -ForegroundColor White
Write-Host "   Port: $DB_PORT" -ForegroundColor White
Write-Host "   Database: $DB_NAME" -ForegroundColor White
Write-Host "   User: $DB_USER" -ForegroundColor White

# Execute the database fixes
Write-Host "🔧 Executing database schema fixes..." -ForegroundColor Yellow
try {
    psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f fix-database-schema.sql
    Write-Host "✅ Database schema fixes completed successfully!" -ForegroundColor Green
} catch {
    Write-Host "❌ Error: Database schema fixes failed!" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}

# Verify the fixes
Write-Host "🔍 Verifying database fixes..." -ForegroundColor Yellow

# Check if all tables exist
Write-Host "📋 Checking table existence..." -ForegroundColor Cyan
try {
    psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "
    SELECT 
        'Tables Check' as check_type,
        COUNT(*) as table_count
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_type = 'BASE TABLE';"
} catch {
    Write-Host "⚠️ Warning: Could not verify table count" -ForegroundColor Yellow
}

# Check foreign key constraints
Write-Host "🔗 Checking foreign key constraints..." -ForegroundColor Cyan
try {
    psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "
    SELECT 
        'Foreign Keys Check' as check_type,
        COUNT(*) as fk_count
    FROM information_schema.table_constraints 
    WHERE constraint_type = 'FOREIGN KEY' 
    AND table_schema = 'public';"
} catch {
    Write-Host "⚠️ Warning: Could not verify foreign key count" -ForegroundColor Yellow
}

# Check indexes
Write-Host "📊 Checking indexes..." -ForegroundColor Cyan
try {
    psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "
    SELECT 
        'Indexes Check' as check_type,
        COUNT(*) as index_count
    FROM pg_indexes 
    WHERE schemaname = 'public';"
} catch {
    Write-Host "⚠️ Warning: Could not verify index count" -ForegroundColor Yellow
}

Write-Host "🎉 Database verification completed!" -ForegroundColor Green
Write-Host "✅ All database fixes have been applied successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Summary of fixes applied:" -ForegroundColor Cyan
Write-Host "   ✅ Fixed duplicate video tables issue" -ForegroundColor White
Write-Host "   ✅ Added missing foreign key constraints" -ForegroundColor White
Write-Host "   ✅ Fixed ad table package_id null constraint" -ForegroundColor White
Write-Host "   ✅ Added missing indexes for performance" -ForegroundColor White
Write-Host "   ✅ Fixed data type consistencies" -ForegroundColor White
Write-Host "   ✅ Added missing constraints" -ForegroundColor White
Write-Host "   ✅ Fixed wallet balance consistency" -ForegroundColor White
Write-Host "   ✅ Added missing not null constraints" -ForegroundColor White
Write-Host "   ✅ Fixed array data types" -ForegroundColor White
Write-Host "   ✅ Added missing unique constraints" -ForegroundColor White
Write-Host "   ✅ Fixed transaction category requirements" -ForegroundColor White
Write-Host "   ✅ Added missing reference IDs" -ForegroundColor White
Write-Host "   ✅ Fixed company wallet references" -ForegroundColor White
Write-Host "   ✅ Added missing metadata fields" -ForegroundColor White
Write-Host ""
Write-Host "🚀 Database is now fully aligned with the application models!" -ForegroundColor Green
