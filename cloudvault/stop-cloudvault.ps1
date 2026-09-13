$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot
docker compose stop postgres
Write-Host "PostgreSQL stopped. Close the backend/frontend PowerShell windows to stop the dev servers." -ForegroundColor Yellow
