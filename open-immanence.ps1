Add-Type -AssemblyName System.Windows.Forms
$sendkeys = [System.Windows.Forms.SendKeys]

# Focus on address bar
Start-Sleep -Milliseconds 300
$sendkeys::SendWait('^l')
Start-Sleep -Milliseconds 300

# Clear any existing text
$sendkeys::SendWait('^a')
Start-Sleep -Milliseconds 100

# Type localhost directly
$sendkeys::SendWait('localhost:5173/Immanence/')
Start-Sleep -Milliseconds 300

# Press Enter to navigate
$sendkeys::SendWait('{ENTER}')
Start-Sleep -Milliseconds 3000

Write-Host "Navigation complete"
