# Development Server Reset Script
# Use this when you have multiple servers running or version mismatches

Write-Host "🧹 Cleaning development environment..." -ForegroundColor Cyan

# Find and display all Node processes
$nodeProcesses = Get-Process -Name node -ErrorAction SilentlyContinue
if ($nodeProcesses) {
    Write-Host "Found $($nodeProcesses.Count) Node process(es):" -ForegroundColor Yellow
    $nodeProcesses | ForEach-Object {
        $ports = Get-NetTCPConnection -OwningProcess $_.Id -State Listen -ErrorAction SilentlyContinue | Select-Object -ExpandProperty LocalPort
        Write-Host "  PID $($_.Id) - Ports: $($ports -join ', ')" -ForegroundColor Yellow
    }
    
    # Try graceful stop first
    Write-Host "Stopping Node processes..."
    Stop-Process -Name node -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 1
    
    # Check if any survived and need admin rights
    $remaining = Get-Process -Name node -ErrorAction SilentlyContinue
    if ($remaining) {
        Write-Host "⚠️  Some Node processes require admin rights to stop." -ForegroundColor Red
        Write-Host "Run this in an ADMIN PowerShell:" -ForegroundColor Red
        Write-Host "  taskkill /F /IM node.exe" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Or restart your computer to clear all processes." -ForegroundColor Yellow
    } else {
        Write-Host "✅ All Node processes stopped" -ForegroundColor Green
    }
} else {
    Write-Host "✅ No Node processes running" -ForegroundColor Green
}

# Clear Vite cache
if (Test-Path "node_modules/.vite") {
    Write-Host "Clearing Vite cache..."
    Remove-Item -Recurse -Force "node_modules/.vite"
    Write-Host "✅ Vite cache cleared" -ForegroundColor Green
} else {
    Write-Host "✅ No Vite cache to clear" -ForegroundColor Green
}

# Optional: Clear dist folder
if (Test-Path "dist") {
    Write-Host "Clearing dist folder..."
    Remove-Item -Recurse -Force "dist"
    Write-Host "✅ Dist folder cleared" -ForegroundColor Green
}

Write-Host ""
Write-Host "🚀 Ready to start fresh!" -ForegroundColor Green
Write-Host "Run: npm run dev" -ForegroundColor Cyan
