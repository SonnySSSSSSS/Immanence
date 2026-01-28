Add-Type -AssemblyName System.Windows.Forms
$sendkeys = [System.Windows.Forms.SendKeys]

Start-Sleep -Milliseconds 500

# Ctrl+T to open new tab
$sendkeys::SendWait('^t')
Start-Sleep -Milliseconds 500

# Type the localhost URL
$sendkeys::SendWait('localhost:5173/Immanence/')
Start-Sleep -Milliseconds 300

# Press Enter
$sendkeys::SendWait('{ENTER}')
Start-Sleep -Milliseconds 4000

Write-Host "Opened Immanence app"
