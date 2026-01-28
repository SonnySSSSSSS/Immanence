$code = @"
[DllImport("user32.dll")]
public static extern bool SetForegroundWindow(IntPtr hWnd);
"@

Add-Type -MemberDefinition $code -Name NativeWindowAPI -Namespace NativeWindowAPI -ErrorAction SilentlyContinue

$handles = (Get-Process firefox -ErrorAction SilentlyContinue).MainWindowHandle
foreach ($h in $handles) {
    [NativeWindowAPI.NativeWindowAPI]::SetForegroundWindow($h)
    Start-Sleep -Milliseconds 200
}
Write-Host 'Brought Firefox to focus'
