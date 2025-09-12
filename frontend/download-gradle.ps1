# PowerShell script to manually download Gradle
Write-Host "Downloading Gradle 8.6 manually..." -ForegroundColor Green

$gradleVersion = "8.6"
$gradleUrl = "https://services.gradle.org/distributions/gradle-${gradleVersion}-all.zip"
$gradleHome = "$env:USERPROFILE\.gradle\wrapper\dists\gradle-${gradleVersion}-all"
$gradleZip = "$gradleHome\gradle-${gradleVersion}-all.zip"

# Create directory if it doesn't exist
if (!(Test-Path $gradleHome)) {
    New-Item -ItemType Directory -Path $gradleHome -Force
    Write-Host "Created directory: $gradleHome" -ForegroundColor Yellow
}

# Download Gradle if not already present
if (!(Test-Path $gradleZip)) {
    Write-Host "Downloading from: $gradleUrl" -ForegroundColor Cyan
    try {
        Invoke-WebRequest -Uri $gradleUrl -OutFile $gradleZip -TimeoutSec 300
        Write-Host "Download completed successfully!" -ForegroundColor Green
    } catch {
        Write-Host "Download failed: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host "Please download manually from: $gradleUrl" -ForegroundColor Yellow
        Write-Host "And place it in: $gradleZip" -ForegroundColor Yellow
    }
} else {
    Write-Host "Gradle already exists: $gradleZip" -ForegroundColor Green
}

Write-Host "You can now try running: npx cap sync" -ForegroundColor Cyan
