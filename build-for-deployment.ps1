# BGS Invoice Generator — Build for Hostinger Deployment
# Run this script from the project root: .\build-for-deployment.ps1

Write-Host "=== BGS Invoice Generator - Production Build ===" -ForegroundColor Cyan

# Step 1: Build the React frontend
Write-Host "`n[1/3] Building React frontend..." -ForegroundColor Yellow
Set-Location frontend
npm install
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Frontend build failed!" -ForegroundColor Red
    exit 1
}
Set-Location ..

# Step 2: Copy frontend build into backend/public
Write-Host "`n[2/3] Copying build files to backend/public..." -ForegroundColor Yellow
$publicDir = "backend\public"
if (Test-Path $publicDir) {
    Remove-Item -Recurse -Force $publicDir
}
New-Item -ItemType Directory -Path $publicDir | Out-Null
Copy-Item -Recurse "frontend\dist\*" $publicDir
Write-Host "  Copied to $publicDir" -ForegroundColor Green

# Step 3: Create a deployment ZIP
Write-Host "`n[3/3] Creating deployment package (backend_deploy.zip)..." -ForegroundColor Yellow

# Files/folders to include in the ZIP (excludes node_modules)
$include = @(
    "backend\config",
    "backend\controllers",
    "backend\prisma",
    "backend\public",
    "backend\routes",
    "backend\scripts",
    "backend\server.js",
    "backend\package.json"
)

if (Test-Path "backend_deploy.zip") {
    Remove-Item "backend_deploy.zip"
}

Compress-Archive -Path $include -DestinationPath "backend_deploy.zip"

Write-Host "`n=== Build Complete! ===" -ForegroundColor Green
Write-Host "  Deployment package: backend_deploy.zip" -ForegroundColor Cyan
Write-Host "  Upload backend_deploy.zip to Hostinger and extract it." -ForegroundColor Cyan
Write-Host "  Then follow the steps in DEPLOY.md" -ForegroundColor Cyan
