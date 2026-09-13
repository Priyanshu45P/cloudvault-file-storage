$ErrorActionPreference = "Stop"
$Root = $PSScriptRoot

Write-Host "CloudVault setup" -ForegroundColor Cyan
Write-Host "1/4 Starting PostgreSQL..."
Set-Location $Root
docker compose up -d postgres

Write-Host "2/4 Preparing backend..."
Set-Location (Join-Path $Root "backend")
if (-not (Test-Path ".env")) { Copy-Item ".env.example" ".env" }
npm install
npm run prisma:generate
npx prisma db push

$seed = Read-Host "Seed demo accounts (alice/bob)? [Y/n]"
if ($seed -notmatch '^[Nn]$') { npm run seed }

Write-Host "3/4 Preparing frontend..."
Set-Location (Join-Path $Root "frontend")
if (-not (Test-Path ".env")) { Copy-Item ".env.example" ".env" }
npm install

Write-Host "4/4 Setup complete." -ForegroundColor Green
Write-Host "Run .\start-cloudvault.ps1 from the project root to start the app."
Set-Location $Root
