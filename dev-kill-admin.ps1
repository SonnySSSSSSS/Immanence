# ADMIN ONLY - Nuclear Process Killer
# Run this ONLY when dev-reset.ps1 says processes need admin rights

#Requires -RunAsAdministrator

Write-Host "🔥 ADMIN MODE - Killing all Node processes..." -ForegroundColor Red

# Kill all node processes with force
taskkill /F /IM node.exe

Write-Host "✅ All Node processes terminated" -ForegroundColor Green
Write-Host ""
Write-Host "Now run in your normal terminal:" -ForegroundColor Cyan
Write-Host "  npm run dev" -ForegroundColor Yellow
