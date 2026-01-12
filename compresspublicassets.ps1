Write-Host "Starting lossless compression in /public..." -ForegroundColor Cyan

$publicPath = "public"

# PNG — lossless
Write-Host "Optimizing PNG files..."
oxipng -o 4 -r $publicPath

# JPG / JPEG — lossless (metadata strip only)
Write-Host "Optimizing JPEG files..."
Get-ChildItem $publicPath -Recurse -Include *.jpg,*.jpeg | ForEach-Object {
    jpegoptim --strip-all "$($_.FullName)" | Out-Null
}

# GIF — lossless
Write-Host "Optimizing GIF files..."
Get-ChildItem $publicPath -Recurse -Include *.gif | ForEach-Object {
    gifsicle -O3 -b "$($_.FullName)"
}

Write-Host "Lossless compression complete. Filenames unchanged." -ForegroundColor Green
