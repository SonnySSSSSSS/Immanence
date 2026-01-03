# Batch process PNG images to make white/black backgrounds transparent
# This script processes all title images in sets 2-5

Add-Type -AssemblyName System.Drawing

function Make-Transparent {
    param(
        [string]$ImagePath,
        [string]$BackgroundColor  # "white" or "black"
    )
    
    Write-Host "Processing: $ImagePath (removing $BackgroundColor)"
    
    $image = [System.Drawing.Image]::FromFile($ImagePath)
    $bitmap = New-Object System.Drawing.Bitmap($image.Width, $image.Height)
    
    # Create graphics object
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    $graphics.Clear([System.Drawing.Color]::Transparent)
    
    # Process each pixel
    for ($y = 0; $y -lt $image.Height; $y++) {
        for ($x = 0; $x -lt $image.Width; $x++) {
            $pixel = $image.GetPixel($x, $y)
            
            # Check if pixel is close to white or black (with tolerance)
            $isBackground = $false
            
            if ($BackgroundColor -eq "white") {
                # Remove white (RGB values all > 240)
                if ($pixel.R -gt 240 -and $pixel.G -gt 240 -and $pixel.B -gt 240) {
                    $isBackground = $true
                }
            } else {
                # Remove black (RGB values all < 15)
                if ($pixel.R -lt 15 -and $pixel.G -lt 15 -and $pixel.B -lt 15) {
                    $isBackground = $true
                }
            }
            
            if (-not $isBackground) {
                $bitmap.SetPixel($x, $y, $pixel)
            }
        }
    }
    
    # Save with transparency
    $image.Dispose()
    $bitmap.Save($ImagePath, [System.Drawing.Imaging.ImageFormat]::Png)
    $bitmap.Dispose()
    $graphics.Dispose()
}

# Process light mode images (remove white)
Write-Host "`n=== Processing Light Mode Images (removing white) ===`n"
Get-ChildItem "public/titles/set*/light/*.png" -Recurse | ForEach-Object {
    Make-Transparent -ImagePath $_.FullName -BackgroundColor "white"
}

# Process dark mode images (remove black)
Write-Host "`n=== Processing Dark Mode Images (removing black) ===`n"
Get-ChildItem "public/titles/set*/dark/*.png" -Recurse | ForEach-Object {
    Make-Transparent -ImagePath $_.FullName -BackgroundColor "black"
}

Write-Host "`n=== Done! All images processed ===`n"
