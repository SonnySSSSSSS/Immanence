# Remove white backgrounds from all title images
# Requires ImageMagick to be installed: winget install ImageMagick.ImageMagick
# Or download from: https://imagemagick.org/script/download.php

$titlesDir = "d:\Unity Apps\immanence-os\public\titles"
$backupDir = "$titlesDir\backup"

# Create backup directory
if (!(Test-Path $backupDir)) {
    New-Item -ItemType Directory -Path $backupDir | Out-Null
    Write-Host "Created backup directory: $backupDir" -ForegroundColor Green
}

# Get all PNG files
$pngFiles = Get-ChildItem -Path $titlesDir -Filter "*.png" | Where-Object { $_.Name -ne "backup" }

Write-Host "Found $($pngFiles.Count) PNG files to process" -ForegroundColor Cyan

foreach ($file in $pngFiles) {
    $inputPath = $file.FullName
    $backupPath = Join-Path $backupDir $file.Name
    $outputPath = $inputPath  # Overwrite original
    
    # Backup original
    if (!(Test-Path $backupPath)) {
        Copy-Item $inputPath $backupPath
        Write-Host "Backed up: $($file.Name)" -ForegroundColor Gray
    }
    
    # Remove white background using ImageMagick
    # -fuzz 10% allows for slight variations in white color
    # -transparent white makes white pixels transparent
    try {
        & magick $inputPath -fuzz 10% -transparent white $outputPath
        Write-Host "Processed: $($file.Name)" -ForegroundColor Green
    }
    catch {
        Write-Host "Error processing $($file.Name): $_" -ForegroundColor Red
    }
}

Write-Host "`nDone! All images have been processed." -ForegroundColor Cyan
Write-Host "Originals backed up to: $backupDir" -ForegroundColor Gray
