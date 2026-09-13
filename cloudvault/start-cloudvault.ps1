$ErrorActionPreference = "Stop"
$Root = $PSScriptRoot
Set-Location $Root

docker compose up -d postgres

$backendPath = Join-Path $Root "backend"
$frontendPath = Join-Path $Root "frontend"

Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$backendPath'; npm run dev"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$frontendPath'; npm run dev"

Write-Host "CloudVault is starting:" -ForegroundColor Cyan
Write-Host "  Frontend: http://localhost:5173"
Write-Host "  Backend : http://localhost:4000"
Write-Host "  Health  : http://localhost:4000/health"
