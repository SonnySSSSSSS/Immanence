[Reflection.Assembly]::LoadWithPartialName('System.Drawing') | Out-Null
[Reflection.Assembly]::LoadWithPartialName('System.Windows.Forms') | Out-Null

$screen = [System.Windows.Forms.Screen]::PrimaryScreen
$bitmap = New-Object System.Drawing.Bitmap($screen.Bounds.Width, $screen.Bounds.Height)
$graphics = [System.Drawing.Graphics]::FromImage($bitmap)
$graphics.CopyFromScreen($screen.Bounds.Location, [System.Drawing.Point]::Empty, $screen.Bounds.Size)
$bitmap.Save('C:\Users\trinh\screenshot.png')
$graphics.Dispose()
$bitmap.Dispose()
Write-Host 'Screenshot saved to C:\Users\trinh\screenshot.png'
