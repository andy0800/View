@echo off
echo 🚀 Starting VIEW APP Services...
echo.

echo 🧹 Cleaning up any existing processes...
taskkill /F /IM node.exe >nul 2>&1
echo ✅ Cleanup completed

echo.
echo 🔧 Starting Backend Server...
start cmd /k "cd backend && npm start"
timeout /t 5 /nobreak >nul

echo.
echo 🎨 Starting Frontend Server...
start cmd /k "cd frontend && npm run dev"
timeout /t 5 /nobreak >nul

echo.
echo 🎉 All services started successfully!
echo.
echo 📱 Frontend: http://localhost:5173
echo 🔧 Backend:  http://localhost:4001
echo.
echo 💡 Use 'npm run clean' to stop all services
pause
