# Build script that works around Gradle network issues
Write-Host "Building View app without network-dependent sync..." -ForegroundColor Green

# Build the web assets first
Write-Host "Building web assets..." -ForegroundColor Cyan
npm run build

if ($LASTEXITCODE -eq 0) {
    Write-Host "Web build successful!" -ForegroundColor Green
    
    # Copy assets manually to avoid Gradle network issues
    Write-Host "Copying assets to Android..." -ForegroundColor Cyan
    
    $androidAssetsDir = "android\app\src\main\assets\public"
    if (Test-Path $androidAssetsDir) {
        Remove-Item "$androidAssetsDir\*" -Recurse -Force
    } else {
        New-Item -ItemType Directory -Path $androidAssetsDir -Force
    }
    
    Copy-Item "dist\*" -Destination $androidAssetsDir -Recurse -Force
    Write-Host "Assets copied to Android project!" -ForegroundColor Green
    
    # Copy to iOS as well
    $iosAssetsDir = "ios\App\App\public"
    if (Test-Path $iosAssetsDir) {
        Remove-Item "$iosAssetsDir\*" -Recurse -Force
    } else {
        New-Item -ItemType Directory -Path $iosAssetsDir -Force
    }
    
    Copy-Item "dist\*" -Destination $iosAssetsDir -Recurse -Force
    Write-Host "Assets copied to iOS project!" -ForegroundColor Green
    
    Write-Host "Ready to open Android Studio!" -ForegroundColor Green
    Write-Host "Run: npx cap open android" -ForegroundColor Cyan
} else {
    Write-Host "Web build failed!" -ForegroundColor Red
}
