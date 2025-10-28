# =============================================================================
# QUICK EXECUTION SCRIPT - 24HR REWARD SYSTEM
# =============================================================================

Write-Host "==============================================================================" -ForegroundColor Cyan
Write-Host "  EXECUTING 24-HOUR REWARD SYSTEM CHANGES" -ForegroundColor Cyan
Write-Host "==============================================================================" -ForegroundColor Cyan
Write-Host ""

# Database connection details
$DB_URL = "postgresql://viewapp_postgres_user:Hj82NSRMhqsi2GgTzoG0Wmzs8Se21GAf@dpg-d2vdj7ogjchc73b4iqig-a/viewapp_postgres"

# Parse connection string
$DB_HOST = "dpg-d2vdj7ogjchc73b4iqig-a.oregon-postgres.render.com"
$DB_PORT = "5432"
$DB_NAME = "viewapp_postgres"
$DB_USER = "viewapp_postgres_user"
$DB_PASS = "Hj82NSRMhqsi2GgTzoG0Wmzs8Se21GAf"

Write-Host "📊 Connecting to production database..." -ForegroundColor Yellow
Write-Host "  Host: $DB_HOST" -ForegroundColor White
Write-Host "  Database: $DB_NAME" -ForegroundColor White
Write-Host ""

# Check if psql is available
$psql = Get-Command psql -ErrorAction SilentlyContinue
if (-not $psql) {
    Write-Host "❌ ERROR: psql not found!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please install PostgreSQL client:" -ForegroundColor Yellow
    Write-Host "  Download from: https://www.postgresql.org/download/windows/" -ForegroundColor White
    Write-Host "  Or use: choco install postgresql" -ForegroundColor White
    Write-Host ""
    Write-Host "Alternative: Use an online PostgreSQL client like pgAdmin or DBeaver" -ForegroundColor Yellow
    exit 1
}

# Set password environment variable
$env:PGPASSWORD = $DB_PASS

Write-Host "🚀 Executing SQL script..." -ForegroundColor Green
Write-Host ""

# Execute the SQL file
$sqlFile = Join-Path $PSScriptRoot "add-24hr-reward-system.sql"

try {
    psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f $sqlFile
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "==============================================================================" -ForegroundColor Green
        Write-Host "  ✅ SUCCESS! Database changes applied!" -ForegroundColor Green
        Write-Host "==============================================================================" -ForegroundColor Green
        Write-Host ""
        Write-Host "📋 Next Steps:" -ForegroundColor Cyan
        Write-Host "  1. ✅ Database indexes created" -ForegroundColor Green
        Write-Host "  2. 🔄 Restart your backend server" -ForegroundColor Yellow
        Write-Host "  3. ✅ Code changes already in place" -ForegroundColor Green
        Write-Host ""
        Write-Host "🎉 Users can now earn rewards every 24 hours!" -ForegroundColor Green
    } else {
        Write-Host ""
        Write-Host "❌ ERROR: Execution failed" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host ""
    Write-Host "❌ ERROR: $_" -ForegroundColor Red
    exit 1
} finally {
    Remove-Item Env:\PGPASSWORD -ErrorAction SilentlyContinue
}

