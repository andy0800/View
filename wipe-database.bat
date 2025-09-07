@echo off
echo.
echo ========================================
echo    DATABASE COMPLETE WIPE SCRIPT
echo ========================================
echo.
echo ⚠️  WARNING: This will DELETE ALL DATA from the database!
echo ⚠️  This action cannot be undone!
echo.
echo Are you absolutely sure you want to continue?
echo.
set /p confirm="Type 'YES' to confirm: "

if /i "%confirm%"=="YES" (
    echo.
    echo 🚨 Proceeding with database wipe...
    echo.
    cd backend
    echo Running SQL-based data wipe...
    npm run wipe-data-sql
    echo.
    echo Database wipe completed!
    pause
) else (
    echo.
    echo ❌ Database wipe cancelled.
    pause
)
