# Batch rename avatar files
# From: Stage_Path_Attention_00001_.png
# To: avatar-stage-path-attention_00001_.png

$avatarDir = "d:\Unity Apps\immanence-os\public\avatars"
$files = Get-ChildItem $avatarDir | Where-Object { $_.Name -match '^[A-Z][a-z]+_[A-Z][a-z]+_[A-Z][a-z]+_\d+_\.png$' }

Write-Host "Found $($files.Count) files to rename`n"

foreach ($file in $files) {
    $name = $file.Name
    
    # Parse the filename: Stage_Path_Attention_00001_.png
    if ($name -match '^([A-Z][a-z]+)_([A-Z][a-z]+)_([A-Z][a-z]+)_(\d+_)\.png$') {
        $stage = $matches[1].ToLower()
        $path = $matches[2].ToLower()  
        $attention = $matches[3].ToLower()
        $suffix = $matches[4]
        
        $newName = "avatar-$stage-$path-$attention`_$suffix.png"
        
        $oldPath = Join-Path $avatarDir $name
        $newPath = Join-Path $avatarDir $newName
        
        if (Test-Path $newPath) {
            Write-Host "SKIP (exists): $newName"
        } else {
            Rename-Item -Path $oldPath -NewName $newName
            Write-Host "RENAMED: $name -> $newName"
        }
    }
}

Write-Host "`nRename complete!"
