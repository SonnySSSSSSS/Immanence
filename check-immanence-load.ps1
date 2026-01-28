Add-Type -AssemblyName System.Windows.Forms
$sendkeys = [System.Windows.Forms.SendKeys]

# Close or minimize VS Code first - press Win+D to show desktop, then reopen Firefox
Start-Sleep -Milliseconds 300
$sendkeys::SendWait('{LWin}d')
Start-Sleep -Milliseconds 1000

# Now click on Firefox in taskbar or open it
# Try to switch to Firefox using Alt+Tab
$sendkeys::SendWait('%{TAB}')
Start-Sleep -Milliseconds 500

# Take a screenshot
Write-Host "Switched focus"
