[CmdletBinding()]
param(
    [string]$RepoRoot,
    [string]$PublicRoot,
    [string]$ManifestPath,
    [switch]$DryRun
)

$ErrorActionPreference = 'Stop'
$scriptDirectory = Split-Path -Parent $PSCommandPath

if ([string]::IsNullOrWhiteSpace($RepoRoot)) {
    $RepoRoot = Join-Path $scriptDirectory '..'
}

if ([string]::IsNullOrWhiteSpace($PublicRoot)) {
    $PublicRoot = Join-Path $scriptDirectory '..\public'
}

if ([string]::IsNullOrWhiteSpace($ManifestPath)) {
    $ManifestPath = Join-Path $scriptDirectory 'webp-manifest.json'
}

function Normalize-RepoRelativePath {
    param([string]$PathValue)

    $normalized = ($PathValue -replace '\\', '/').Trim()
    while ($normalized.StartsWith('./')) {
        $normalized = $normalized.Substring(2)
    }
    $normalized = $normalized.TrimStart('/')
    return $normalized
}

function Get-RelativePathCompat {
    param(
        [string]$BasePath,
        [string]$TargetPath
    )

    $baseFull = [System.IO.Path]::GetFullPath($BasePath)
    $targetFull = [System.IO.Path]::GetFullPath($TargetPath)

    if (-not $baseFull.EndsWith([System.IO.Path]::DirectorySeparatorChar)) {
        $baseFull = $baseFull + [System.IO.Path]::DirectorySeparatorChar
    }

    $baseUri = [System.Uri]$baseFull
    $targetUri = [System.Uri]$targetFull
    $relativeUri = $baseUri.MakeRelativeUri($targetUri)
    $relativePath = [System.Uri]::UnescapeDataString($relativeUri.ToString())

    return ($relativePath -replace '/', [System.IO.Path]::DirectorySeparatorChar)
}

function Add-ReplacementMapEntry {
    param(
        [hashtable]$Map,
        [string]$PngRelative,
        [string]$WebpRelative
    )

    $pngNormalized = Normalize-RepoRelativePath -PathValue $PngRelative
    $webpNormalized = Normalize-RepoRelativePath -PathValue $WebpRelative

    if ([string]::IsNullOrWhiteSpace($pngNormalized) -or [string]::IsNullOrWhiteSpace($webpNormalized)) {
        return
    }

    if (-not $webpNormalized.StartsWith('public/', [System.StringComparison]::OrdinalIgnoreCase)) {
        $webpNormalized = "public/$webpNormalized"
    }

    $keys = @($pngNormalized)
    if ($pngNormalized.StartsWith('public/', [System.StringComparison]::OrdinalIgnoreCase)) {
        $keys += $pngNormalized.Substring(7)
    }
    else {
        $keys += "public/$pngNormalized"
    }

    foreach ($key in $keys) {
        $Map[$key.ToLowerInvariant()] = $webpNormalized
    }
}

function Get-PublicRelativeCandidates {
    param(
        [string]$CandidatePath,
        [string]$FileDirectory,
        [string]$PublicRootPath
    )

    $results = New-Object System.Collections.Generic.List[string]
    $seen = @{}

    $variants = New-Object System.Collections.Generic.List[string]
    $variants.Add($CandidatePath)
    try {
        $decoded = [System.Uri]::UnescapeDataString($CandidatePath)
        if ($decoded -ne $CandidatePath) {
            $variants.Add($decoded)
        }
    }
    catch {
        # Keep original candidate only.
    }

    foreach ($variant in $variants) {
        $v = ($variant -replace '\\', '/').Trim()
        if ([string]::IsNullOrWhiteSpace($v)) {
            continue
        }

        $addCandidate = {
            param([string]$PathToAdd)

            $normalized = Normalize-RepoRelativePath -PathValue $PathToAdd
            if ([string]::IsNullOrWhiteSpace($normalized)) {
                return
            }

            $key = $normalized.ToLowerInvariant()
            if (-not $seen.ContainsKey($key)) {
                $seen[$key] = $true
                $results.Add($normalized)
            }
        }

        if ($v.StartsWith('public/', [System.StringComparison]::OrdinalIgnoreCase)) {
            & $addCandidate $v
            & $addCandidate ($v.Substring(7))
        }

        if ($v.StartsWith('/')) {
            & $addCandidate ($v.TrimStart('/'))
        }

        if ($v.StartsWith('./') -or $v.StartsWith('../')) {
            try {
                $absoluteFromFile = [System.IO.Path]::GetFullPath((Join-Path $FileDirectory $v))
                if ($absoluteFromFile.StartsWith($PublicRootPath, [System.StringComparison]::OrdinalIgnoreCase)) {
                    $relativeFromPublic = Get-RelativePathCompat -BasePath $PublicRootPath -TargetPath $absoluteFromFile
                    & $addCandidate $relativeFromPublic
                }
            }
            catch {
                # Ignore invalid local path candidate.
            }
        }

        if (
            -not $v.StartsWith('/') -and
            -not $v.StartsWith('./') -and
            -not $v.StartsWith('../') -and
            -not ($v -match '^[A-Za-z]:')
        ) {
            & $addCandidate $v

            try {
                $absoluteFromFile = [System.IO.Path]::GetFullPath((Join-Path $FileDirectory $v))
                if ($absoluteFromFile.StartsWith($PublicRootPath, [System.StringComparison]::OrdinalIgnoreCase)) {
                    $relativeFromPublic = Get-RelativePathCompat -BasePath $PublicRootPath -TargetPath $absoluteFromFile
                    & $addCandidate $relativeFromPublic
                }
            }
            catch {
                # Ignore invalid local path candidate.
            }
        }
    }

    return $results
}

function Resolve-ReplacementKey {
    param(
        [string]$CandidatePath,
        [string]$FileDirectory,
        [string]$PublicRootPath,
        [hashtable]$Map
    )

    $candidates = Get-PublicRelativeCandidates -CandidatePath $CandidatePath -FileDirectory $FileDirectory -PublicRootPath $PublicRootPath
    foreach ($candidate in $candidates) {
        $normalized = Normalize-RepoRelativePath -PathValue $candidate
        if ([string]::IsNullOrWhiteSpace($normalized)) {
            continue
        }

        $key1 = $normalized.ToLowerInvariant()
        if ($Map.ContainsKey($key1)) {
            return $key1
        }

        $key2 = if ($normalized.StartsWith('public/', [System.StringComparison]::OrdinalIgnoreCase)) {
            $normalized.Substring(7).ToLowerInvariant()
        }
        else {
            ("public/" + $normalized).ToLowerInvariant()
        }
        if ($Map.ContainsKey($key2)) {
            return $key2
        }
    }

    return $null
}

try {
    $repoRootPath = (Resolve-Path -LiteralPath $RepoRoot).Path
    $publicRootPath = (Resolve-Path -LiteralPath $PublicRoot).Path

    $replacementMap = @{}

    if (Test-Path -LiteralPath $ManifestPath) {
        $manifestRaw = Get-Content -LiteralPath $ManifestPath -Raw
        $manifestJson = $manifestRaw | ConvertFrom-Json
        if ($null -ne $manifestJson) {
            foreach ($property in $manifestJson.PSObject.Properties) {
                Add-ReplacementMapEntry -Map $replacementMap -PngRelative $property.Name -WebpRelative ([string]$property.Value)
            }
        }
        Write-Host "Loaded manifest mappings from: $ManifestPath"
    }
    else {
        Write-Host "Manifest not found at: $ManifestPath (falling back to public scan)"
    }

    $webpFiles = Get-ChildItem -LiteralPath $publicRootPath -Recurse -File | Where-Object { $_.Extension -ieq '.webp' }
    foreach ($webpFile in $webpFiles) {
        $webpRelativeFromPublic = Normalize-RepoRelativePath -PathValue (Get-RelativePathCompat -BasePath $publicRootPath -TargetPath $webpFile.FullName)
        $pngRelativeFromPublic = [System.Text.RegularExpressions.Regex]::Replace($webpRelativeFromPublic, '(?i)\.webp$', '.png')
        Add-ReplacementMapEntry -Map $replacementMap -PngRelative $pngRelativeFromPublic -WebpRelative ("public/" + $webpRelativeFromPublic)
    }

    if ($replacementMap.Count -eq 0) {
        throw 'No PNG->WebP mappings available. Run conversion first or provide a valid manifest.'
    }

    $allowedExtensions = @('.js', '.jsx', '.ts', '.tsx', '.css', '.scss', '.html', '.json', '.md', '.glsl', '.txt', '.svg')
    $manifestFullPath = if (Test-Path -LiteralPath $ManifestPath) { (Resolve-Path -LiteralPath $ManifestPath).Path } else { $null }
    $filesToScanMap = @{}

    $scanRoots = @(
        (Join-Path $repoRootPath 'src'),
        (Join-Path $repoRootPath 'public')
    )

    foreach ($scanRoot in $scanRoots) {
        if (-not (Test-Path -LiteralPath $scanRoot)) {
            continue
        }

        $rootFiles = Get-ChildItem -LiteralPath $scanRoot -Recurse -File | Where-Object {
            $fullPath = $_.FullName
            $extension = $_.Extension.ToLowerInvariant()
            $allowedExtensions -contains $extension -and ($fullPath -notmatch '[\\/](node_modules|dist|\.git)[\\/]')
        }

        foreach ($rootFile in $rootFiles) {
            $filesToScanMap[$rootFile.FullName] = $rootFile
        }
    }

    $rootAllowlistFiles = @(
        (Join-Path $repoRootPath 'index.html'),
        (Join-Path $repoRootPath 'package.json'),
        (Join-Path $repoRootPath 'README.md')
    )

    foreach ($rootFilePath in $rootAllowlistFiles) {
        if (Test-Path -LiteralPath $rootFilePath) {
            $item = Get-Item -LiteralPath $rootFilePath
            $filesToScanMap[$item.FullName] = $item
        }
    }

    $viteConfigFiles = Get-ChildItem -LiteralPath $repoRootPath -File -Filter 'vite.config.*' -ErrorAction SilentlyContinue
    foreach ($viteConfigFile in $viteConfigFiles) {
        $filesToScanMap[$viteConfigFile.FullName] = $viteConfigFile
    }

    if ($null -ne $manifestFullPath -and $filesToScanMap.ContainsKey($manifestFullPath)) {
        $filesToScanMap.Remove($manifestFullPath) | Out-Null
    }

    $filesToScan = $filesToScanMap.Values

    $pattern = @'
(?i)(?<path>[^\s"'`\r\n<>\(\)][^"'`\r\n<>\(\)]*?\.png)(?<tail>(?:\?[^"'`\s<>\)]*)?(?:#[^"'`\s<>\)]*)?)
'@.Trim()

    $utf8NoBom = New-Object System.Text.UTF8Encoding($false)

    $filesScanned = 0
    $filesWithChanges = 0
    $totalReplacements = 0
    $filesFailed = 0

    foreach ($file in $filesToScan) {
        $filesScanned++
        try {
            $content = Get-Content -LiteralPath $file.FullName -Raw
            if ($null -eq $content) {
                $content = ''
            }

            $script:CurrentFileReplacementCount = 0
            $updated = [System.Text.RegularExpressions.Regex]::Replace(
                $content,
                $pattern,
                [System.Text.RegularExpressions.MatchEvaluator]{
                    param($match)

                $original = $match.Value
                $pathPart = $match.Groups['path'].Value
                $tailPart = $match.Groups['tail'].Value

                if ($pathPart -match '^(?i)(https?:|data:)') {
                    return $original
                }

                $candidateForResolve = $pathPart
                while ($candidateForResolve -match '^\$\{[^}]+\}') {
                    $candidateForResolve = [System.Text.RegularExpressions.Regex]::Replace($candidateForResolve, '^\$\{[^}]+\}', '')
                }

                if ($candidateForResolve -match '\$\{') {
                    return $original
                }

                if ($candidateForResolve -match '\{[^}]*\}') {
                    return $original
                }

                $resolvedKey = Resolve-ReplacementKey -CandidatePath $candidateForResolve -FileDirectory $file.Directory.FullName -PublicRootPath $publicRootPath -Map $replacementMap
                if ($null -eq $resolvedKey) {
                    return $original
                }

                    $webpRepoRelative = $replacementMap[$resolvedKey]
                    $webpAbsolute = Join-Path $repoRootPath ($webpRepoRelative -replace '/', [System.IO.Path]::DirectorySeparatorChar)
                    if (-not (Test-Path -LiteralPath $webpAbsolute)) {
                        return $original
                    }

                    $rewrittenPath = [System.Text.RegularExpressions.Regex]::Replace($pathPart, '(?i)\.png$', '.webp')
                    if ($rewrittenPath -eq $pathPart) {
                        return $original
                    }

                    $script:CurrentFileReplacementCount++
                    return ($rewrittenPath + $tailPart)
                }
            )

            if ($script:CurrentFileReplacementCount -gt 0) {
                $filesWithChanges++
                $totalReplacements += $script:CurrentFileReplacementCount

                $relativeFile = Normalize-RepoRelativePath -PathValue (Get-RelativePathCompat -BasePath $repoRootPath -TargetPath $file.FullName)
                if ($DryRun) {
                    Write-Host "DRY-RUN: $relativeFile ($($script:CurrentFileReplacementCount) replacements)"
                }
                else {
                    [System.IO.File]::WriteAllText($file.FullName, $updated, $utf8NoBom)
                    Write-Host "UPDATED: $relativeFile ($($script:CurrentFileReplacementCount) replacements)"
                }
            }
        }
        catch {
            $filesFailed++
            $relativeFile = Normalize-RepoRelativePath -PathValue (Get-RelativePathCompat -BasePath $repoRootPath -TargetPath $file.FullName)
            Write-Warning "SKIPPED-ERROR: $relativeFile ($($_.Exception.Message))"
        }
    }

    $mode = if ($DryRun) { 'dry-run' } else { 'apply' }
    Write-Host "Summary: mode=$mode filesScanned=$filesScanned filesChanged=$filesWithChanges replacements=$totalReplacements filesFailed=$filesFailed"
    exit 0
}
catch {
    Write-Error $_
    exit 1
}
