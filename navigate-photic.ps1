Add-Type -AssemblyName System.Windows.Forms
$sendkeys = [System.Windows.Forms.SendKeys]

# Wait for browser to be ready
Start-Sleep -Milliseconds 500

# Focus on address bar and ensure we're on the right URL
$sendkeys::SendWait('^l')
Start-Sleep -Milliseconds 300

# Type the URL
$url = "localhost:5173/Immanence/"
[System.Windows.Forms.Clipboard]::SetText($url)
$sendkeys::SendWait('^v')
Start-Sleep -Milliseconds 200

# Press Enter
$sendkeys::SendWait('{ENTER}')
Start-Sleep -Milliseconds 2000

Write-Host "Navigated to Immanence OS"
