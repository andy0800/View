# VIEW APP Startup Script for PowerShell
Write-Host "🚀 Starting VIEW APP Services..." -ForegroundColor Green
Write-Host ""

# Function to kill processes by port
function Stop-ProcessByPort {
    param([int]$Port)
    try {
        $processes = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue | Where-Object {$_.State -eq "Listen"}
        foreach ($process in $processes) {
            Stop-Process -Id $process.OwningProcess -Force -ErrorAction SilentlyContinue
            Write-Host "✅ Stopped process on port $Port" -ForegroundColor Green
        }
    } catch {
        Write-Host "ℹ️ No processes found on port $Port" -ForegroundColor Yellow
    }
}

# Function to kill all Node.js processes
function Stop-AllNodeProcesses {
    try {
        $nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue
        if ($nodeProcesses) {
            Stop-Process -Name "node" -Force
            Write-Host "✅ Stopped all Node.js processes" -ForegroundColor Green
        } else {
            Write-Host "ℹ️ No Node.js processes found" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "ℹ️ No Node.js processes to stop" -ForegroundColor Yellow
    }
}

Write-Host "🧹 Cleaning up any existing processes..." -ForegroundColor Yellow
Stop-AllNodeProcesses
Stop-ProcessByPort -Port 4001  # Backend
Stop-ProcessByPort -Port 5173  # Frontend
Write-Host "✅ Cleanup completed" -ForegroundColor Green

Write-Host ""
Write-Host "🔧 Starting Backend Server..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\backend'; npm start"

Write-Host "⏳ Waiting 5 seconds for backend to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

Write-Host ""
Write-Host "🎨 Starting Frontend Server..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\frontend'; npm run dev"

Write-Host ""
Write-Host "🎉 All services started successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "📱 Frontend: http://localhost:5173" -ForegroundColor White
Write-Host "🔧 Backend:  http://localhost:4001" -ForegroundColor White
Write-Host ""
Write-Host "💡 Use 'npm run clean' to stop all services" -ForegroundColor Yellow
Write-Host "💡 Press any key to close this window..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
