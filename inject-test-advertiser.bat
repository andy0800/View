@echo off
echo 🚀 Injecting Test Advertiser into Database...
echo.
echo 📋 Specifications:
echo   - Phone: +96550000000
echo   - Role: advertiser
echo   - KYC Status: verified
echo   - Wallet Balance: 1,000,000 KWD
echo   - Company: Test Company Ltd
echo.
echo ⚠️  Make sure the backend server is running first!
echo.
pause
echo.
cd backend
npm run inject-test-advertiser
echo.
pause
