$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot\..

Write-Host "Checking Firebase login..." -ForegroundColor Cyan
$loginOutput = firebase login:list 2>&1 | Out-String
if ($loginOutput -match "No authorized accounts") {
    Write-Host ""
    Write-Host "Firebase is not logged in (or your session expired)." -ForegroundColor Red
    Write-Host "Run this first, then deploy again:" -ForegroundColor Yellow
    Write-Host "  firebase login" -ForegroundColor White
    Write-Host ""
    exit 1
}

Write-Host "Building Angular app..." -ForegroundColor Cyan
npm run build:prod
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

$buildPath = "dist\aa-son\browser\index.html"
if (-not (Test-Path $buildPath)) {
    Write-Host "Build output not found at $buildPath" -ForegroundColor Red
    exit 1
}

Write-Host "Deploying to Firebase Hosting (esarwawms)..." -ForegroundColor Cyan
firebase deploy --only hosting --project esarwawms
exit $LASTEXITCODE
