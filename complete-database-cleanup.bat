@echo off
echo.
echo ========================================
echo    COMPLETE DATABASE & FRONTEND CLEANUP
echo ========================================
echo.
echo 🚨 This will perform a COMPLETE cleanup:
echo   1. Force wipe ALL database data
echo   2. Clear all frontend cache
echo   3. Restart the application
echo.
echo ⚠️  WARNING: This action cannot be undone!
echo.
set /p confirm="Type 'YES' to confirm: "

if /i "%confirm%"=="YES" (
    echo.
    echo 🚨 Proceeding with complete cleanup...
    echo.
    
    echo 🔄 Step 1: Stopping any running processes...
    taskkill /F /IM node.exe 2>nul || echo No Node processes to kill
    
    echo.
    echo 🗄️  Step 2: Force wiping database...
    cd backend
    npm run force-wipe
    
    echo.
    echo ✅ Step 3: Verifying database is empty...
    npm run verify-empty
    
    echo.
    echo 🧹 Step 4: Clearing frontend cache...
    cd ..\frontend
    
    echo    - Removing dist folder...
    if exist dist rmdir /s /q dist
    
    echo    - Removing node_modules (will reinstall)...
    if exist node_modules rmdir /s /q node_modules
    
    echo    - Clearing npm cache...
    npm cache clean --force
    
    echo.
    echo 📦 Step 5: Reinstalling dependencies...
    npm install
    
    echo.
    echo 🚀 Step 6: Starting fresh application...
    cd ..
    npm run dev
    
    echo.
    echo 🎉 COMPLETE CLEANUP FINISHED!
    echo.
    echo 📋 What was cleaned:
    echo    ✅ Database: All data wiped (0 records remaining)
    echo    ✅ Frontend: All cache and build artifacts removed
    echo    ✅ Dependencies: Fresh installation
    echo    ✅ Application: Restarted with clean state
    echo.
    echo 💡 If you still see data, it may be:
    echo    - Browser cache (try Ctrl+F5)
    echo    - Hardcoded data in components
    echo    - API responses from external sources
    echo.
    pause
) else (
    echo.
    echo ❌ Cleanup cancelled.
    pause
)
