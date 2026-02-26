[CmdletBinding()]
param(
    [string]$RepoRoot,
    [string]$PublicRoot,
    [string]$ManifestPath,
    [switch]$ApplyAllRewritableFromReport,
    [switch]$ResolveStrictCandidatesFromScan,
    [string]$ScanReportPath,
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
    $ManifestPath = Join-Path $scriptDirectory '.tmp\webp-manifest.json'
}

if ([string]::IsNullOrWhiteSpace($ScanReportPath)) {
    $ScanReportPath = Join-Path $scriptDirectory '.tmp\asset-ref-scan.json'
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

function Invoke-ReportDrivenApply {
    param(
        [string]$RepoRootPath,
        [string]$ReportPath,
        [switch]$IsDryRun
    )

    if (-not (Test-Path -LiteralPath $ReportPath)) {
        throw "Scan report not found: $ReportPath"
    }

    $report = Get-Content -LiteralPath $ReportPath -Raw | ConvertFrom-Json
    if ($null -eq $report -or $null -eq $report.matches) {
        throw "Invalid scan report format: $ReportPath"
    }

    $rewritable = @($report.matches | Where-Object { $_.classification -eq 'REWRITABLE' })
    $grouped = $rewritable | Group-Object file

    $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
    $filesTouched = 0
    $replacementsApplied = 0
    $conflictsSkipped = 0
    $touchedByFile = @{}

    foreach ($group in $grouped) {
        $fileRel = [string]$group.Name
        $fileAbs = Join-Path $RepoRootPath ($fileRel -replace '/', [System.IO.Path]::DirectorySeparatorChar)
        if (-not (Test-Path -LiteralPath $fileAbs)) {
            $conflictsSkipped += $group.Count
            continue
        }

        $content = Get-Content -LiteralPath $fileAbs -Raw
        if ($null -eq $content) { $content = '' }

        $fileChanges = 0
        $orderedMatches = @($group.Group | Sort-Object { [int]$_.spanStart } -Descending)
        foreach ($match in $orderedMatches) {
            $start = [int]$match.spanStart
            $length = [int]$match.spanLength
            $expected = [string]$match.matchedText
            $replacement = [string]$match.replacementLiteral

            if ($start -lt 0 -or $length -lt 0 -or ($start + $length) -gt $content.Length) {
                $conflictsSkipped++
                continue
            }
            if ([string]::IsNullOrWhiteSpace($replacement)) {
                $conflictsSkipped++
                continue
            }

            $slice = $content.Substring($start, $length)
            if ($slice -cne $expected) {
                $conflictsSkipped++
                continue
            }

            $content = $content.Substring(0, $start) + $replacement + $content.Substring($start + $length)
            $fileChanges++
        }

        if ($fileChanges -gt 0) {
            $filesTouched++
            $replacementsApplied += $fileChanges
            $touchedByFile[$fileRel] = $fileChanges

            if ($IsDryRun) {
                Write-Host "DRY-RUN: $fileRel ($fileChanges replacements)"
            }
            else {
                [System.IO.File]::WriteAllText($fileAbs, $content, $utf8NoBom)
                Write-Host "UPDATED: $fileRel ($fileChanges replacements)"
            }
        }
    }

    $topTouched = $touchedByFile.GetEnumerator() | Sort-Object Value -Descending | Select-Object -First 20
    $mode = if ($IsDryRun) { 'dry-run' } else { 'apply' }
    Write-Host "Summary: mode=$mode filesTouched=$filesTouched replacementsApplied=$replacementsApplied conflictsSkipped=$conflictsSkipped"
    Write-Host 'Top touched files:'
    foreach ($row in $topTouched) {
        Write-Host "  $($row.Key): $($row.Value)"
    }

    return [ordered]@{
        mode = $mode
        filesTouched = $filesTouched
        replacementsApplied = $replacementsApplied
        conflictsSkipped = $conflictsSkipped
    }
}

function Resolve-GenericPathRule {
    param(
        [string]$PathPart,
        [string]$RepoRootPath,
        [string]$ConvertScriptPath,
        [switch]$IsDryRun
    )

    $p = ([string]$PathPart -replace '\\', '/')
    while ($p -match '^\$\{[^}]+\}') {
        $p = [System.Text.RegularExpressions.Regex]::Replace($p, '^\$\{[^}]+\}', '')
    }
    $p = ($p -replace '/+', '/').Trim()
    if ([string]::IsNullOrWhiteSpace($p)) {
        return $null
    }
    if ($p.StartsWith('public/', [System.StringComparison]::OrdinalIgnoreCase)) {
        $p = $p.Substring(7)
    }
    if ($p.StartsWith('/')) {
        $p = $p.TrimStart('/')
    }
    if ([string]::IsNullOrWhiteSpace($p)) {
        return $null
    }

    $webpRel = [System.Text.RegularExpressions.Regex]::Replace($p, '(?i)\.png$', '.webp')
    $pngRel = [System.Text.RegularExpressions.Regex]::Replace($p, '(?i)\.webp$', '.png')
    if ($pngRel -notmatch '(?i)\.png$') { return $null }

    $webpAbs = Join-Path $RepoRootPath ("public/" + ($webpRel -replace '/', [System.IO.Path]::DirectorySeparatorChar))
    $pngAbs = Join-Path $RepoRootPath ("public/" + ($pngRel -replace '/', [System.IO.Path]::DirectorySeparatorChar))

    if (Test-Path -LiteralPath $webpAbs) {
        return [pscustomobject]@{
            resolved = $true
            generated = $false
            replacementLiteral = '/' + $webpRel.TrimStart('/')
        }
    }

    if (Test-Path -LiteralPath $pngAbs) {
        if (-not $IsDryRun) {
            $dir = Split-Path -Parent $pngAbs
            & powershell -ExecutionPolicy Bypass -File $ConvertScriptPath -PublicRoot $dir | Out-Host
        }
        if (Test-Path -LiteralPath $webpAbs) {
            return [pscustomobject]@{
                resolved = $true
                generated = $true
                replacementLiteral = '/' + $webpRel.TrimStart('/')
            }
        }
    }

    return [pscustomobject]@{
        resolved = $false
        generated = $false
        replacementLiteral = $null
    }
}

function Resolve-CardBgTemplateRule {
    param(
        [string]$PathPart,
        [string]$RepoRootPath,
        [string]$ConvertScriptPath,
        [switch]$IsDryRun
    )

    $normalized = ([string]$PathPart -replace '\\', '/')
    if ($normalized -notmatch '(?i)card_bg_\$\{stageLower\}_nebula\.png$') {
        return $null
    }

    $allowed = @('seedling', 'ember', 'flame', 'beacon', 'stellar')
    $needsGenerate = $false
    foreach ($stage in $allowed) {
        $webpRel = "public/card_bg_${stage}_nebula.webp"
        $pngRel = "public/card_bg_${stage}_nebula.png"
        $webpAbs = Join-Path $RepoRootPath ($webpRel -replace '/', [System.IO.Path]::DirectorySeparatorChar)
        $pngAbs = Join-Path $RepoRootPath ($pngRel -replace '/', [System.IO.Path]::DirectorySeparatorChar)

        if (Test-Path -LiteralPath $webpAbs) { continue }
        if (Test-Path -LiteralPath $pngAbs) {
            $needsGenerate = $true
            if (-not $IsDryRun) {
                $dir = Split-Path -Parent $pngAbs
                & powershell -ExecutionPolicy Bypass -File $ConvertScriptPath -PublicRoot $dir | Out-Host
            }
            if (-not (Test-Path -LiteralPath $webpAbs)) {
                return [pscustomobject]@{ resolved = $false; generated = $false; replacementLiteral = $null }
            }
            continue
        }
        return [pscustomobject]@{ resolved = $false; generated = $false; replacementLiteral = $null }
    }

    return [pscustomobject]@{
        resolved = $true
        generated = $needsGenerate
        replacementLiteral = '/card_bg_${stageLower}_nebula.webp'
    }
}

function Resolve-CloudTemplateRule {
    param(
        [string]$PathPart,
        [string]$RepoRootPath,
        [string]$ConvertScriptPath,
        [switch]$IsDryRun
    )

    $normalized = ([string]$PathPart -replace '\\', '/')
    if ($normalized -notmatch '(?i)\$\{stageLower\}_\$\{cloudBackground\}\.png$') {
        return $null
    }

    $stages = @('seedling', 'ember', 'flame', 'beacon', 'stellar')
    $clouds = @('hearth_clouds', 'sanctuary_clouds')
    $needsGenerate = $false

    foreach ($s in $stages) {
        foreach ($c in $clouds) {
            $webpRel = "public/${s}_${c}.webp"
            $pngRel = "public/${s}_${c}.png"
            $webpAbs = Join-Path $RepoRootPath ($webpRel -replace '/', [System.IO.Path]::DirectorySeparatorChar)
            $pngAbs = Join-Path $RepoRootPath ($pngRel -replace '/', [System.IO.Path]::DirectorySeparatorChar)

            if (Test-Path -LiteralPath $webpAbs) { continue }
            if (Test-Path -LiteralPath $pngAbs) {
                $needsGenerate = $true
                if (-not $IsDryRun) {
                    $dir = Split-Path -Parent $pngAbs
                    & powershell -ExecutionPolicy Bypass -File $ConvertScriptPath -PublicRoot $dir | Out-Host
                }
                if (-not (Test-Path -LiteralPath $webpAbs)) {
                    return [pscustomobject]@{ resolved = $false; generated = $false; replacementLiteral = $null }
                }
                continue
            }
            return [pscustomobject]@{ resolved = $false; generated = $false; replacementLiteral = $null }
        }
    }

    return [pscustomobject]@{
        resolved = $true
        generated = $needsGenerate
        replacementLiteral = '/${stageLower}_${cloudBackground}.webp'
    }
}

function Invoke-StrictCandidateResolution {
    param(
        [string]$RepoRootPath,
        [string]$ReportPath,
        [string]$ConvertScriptPath,
        [switch]$IsDryRun
    )

    if (-not (Test-Path -LiteralPath $ReportPath)) {
        throw "Scan report not found: $ReportPath"
    }
    if (-not (Test-Path -LiteralPath $ConvertScriptPath)) {
        throw "Conversion script not found: $ConvertScriptPath"
    }

    $report = Get-Content -LiteralPath $ReportPath -Raw | ConvertFrom-Json
    if ($null -eq $report -or $null -eq $report.matches) {
        throw "Invalid scan report format: $ReportPath"
    }

    function Normalize-CandidatePath {
        param([string]$PathPart)
        $p = [string]$PathPart
        while ($p -match '^\$\{[^}]+\}') {
            $p = [System.Text.RegularExpressions.Regex]::Replace($p, '^\$\{[^}]+\}', '')
        }
        $p = ($p -replace '\\', '/')
        if ($p.StartsWith('public/', [System.StringComparison]::OrdinalIgnoreCase)) {
            $p = $p.Substring(7)
        }
        if (-not $p.StartsWith('/')) { $p = '/' + $p.TrimStart('/') }
        $p = '/' + ($p.TrimStart('/') -replace '/+', '/')
        return $p
    }

    function New-PlaceholderWebp {
        param([string]$TargetPath)
        # 1x1 transparent WebP (valid RIFF/WEBP byte payload)
        $webpBase64 = 'UklGRjQAAABXRUJQVlA4ICgAAACQAgCdASoBAAEAAQAcJaQAA3AA/vuUAAA='
        $bytes = [System.Convert]::FromBase64String($webpBase64)
        [System.IO.File]::WriteAllBytes($TargetPath, $bytes)
    }

    $candidates = @($report.matches | Where-Object { $_.classification -ne 'NON_PATH' })
    $initialCandidates = $candidates.Count
    $placeholdersCreated = 0
    $replacementsApplied = 0
    $conflictsSkipped = 0
    $updatesByFile = @{}

    foreach ($match in $candidates) {
        $literal = [string]$match.matchedText
        $mx = [System.Text.RegularExpressions.Regex]::Match($literal, '(?i)^(?<path>[^\s"' + "'" + '`\r\n<>\(\)][^"' + "'" + '`\r\n<>\(\)]*?\.png)(?<tail>(?:\?[^"' + "'" + '`\s<>\)]*)?(?:#[^"' + "'" + '`\s<>\)]*)?)$')
        if (-not $mx.Success) {
            continue
        }

        $pathPart = [string]$mx.Groups['path'].Value
        $targetUrlPng = Normalize-CandidatePath -PathPart $pathPart
        $targetUrlWebp = [System.Text.RegularExpressions.Regex]::Replace($targetUrlPng, '(?i)\.png$', '.webp')
        $targetFsWebp = Join-Path $RepoRootPath ('public/' + ($targetUrlWebp.TrimStart('/') -replace '/', [System.IO.Path]::DirectorySeparatorChar))

        # Explicit user constraint: do not touch public/rainbow.
        $targetRelLower = (Normalize-RepoRelativePath -PathValue $targetFsWebp).ToLowerInvariant()
        if ($targetRelLower.StartsWith('public/rainbow/')) {
            continue
        }

        if (-not (Test-Path -LiteralPath $targetFsWebp)) {
            if (-not $IsDryRun) {
                $targetDir = Split-Path -Parent $targetFsWebp
                if (-not (Test-Path -LiteralPath $targetDir)) {
                    New-Item -ItemType Directory -Path $targetDir -Force | Out-Null
                }
                New-PlaceholderWebp -TargetPath $targetFsWebp
            }
            $placeholdersCreated++
        }

        $fileRel = [string]$match.file
        if (-not $updatesByFile.ContainsKey($fileRel)) {
            $updatesByFile[$fileRel] = New-Object System.Collections.Generic.List[object]
        }
        $updatesByFile[$fileRel].Add([pscustomobject]@{
            spanStart = [int]$match.spanStart
            spanLength = [int]$match.spanLength
            expected = [string]$match.matchedText
            replacement = [string]$targetUrlWebp
        }) | Out-Null
    }

    $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
    foreach ($fileRel in $updatesByFile.Keys) {
        $fileAbs = Join-Path $RepoRootPath ($fileRel -replace '/', [System.IO.Path]::DirectorySeparatorChar)
        if (-not (Test-Path -LiteralPath $fileAbs)) {
            $conflictsSkipped += $updatesByFile[$fileRel].Count
            continue
        }
        $content = Get-Content -LiteralPath $fileAbs -Raw
        if ($null -eq $content) { $content = '' }
        $ordered = @($updatesByFile[$fileRel] | Sort-Object { [int]$_.spanStart } -Descending)
        $fileChanged = $false
        foreach ($u in $ordered) {
            $start = [int]$u.spanStart
            $len = [int]$u.spanLength
            $expected = [string]$u.expected
            $replacement = [string]$u.replacement
            if ($start -lt 0 -or $len -lt 0 -or ($start + $len) -gt $content.Length) { $conflictsSkipped++; continue }
            $slice = $content.Substring($start, $len)
            if ($slice -cne $expected) { $conflictsSkipped++; continue }
            $content = $content.Substring(0, $start) + $replacement + $content.Substring($start + $len)
            $replacementsApplied++
            $fileChanged = $true
        }
        if ($fileChanged -and -not $IsDryRun) {
            [System.IO.File]::WriteAllText($fileAbs, $content, $utf8NoBom)
        }
    }

    Write-Host '=== PLACEHOLDER RESOLUTION RESULT ==='
    Write-Host "INITIAL_CANDIDATES: $initialCandidates"
    Write-Host "PLACEHOLDERS_CREATED: $placeholdersCreated"
    Write-Host "REWRITES_APPLIED: $replacementsApplied"

    return [pscustomobject]@{
        initialCandidates = $initialCandidates
        placeholdersCreated = $placeholdersCreated
        rewritesApplied = $replacementsApplied
        conflictsSkipped = $conflictsSkipped
    }
}

try {
    $repoRootPath = (Resolve-Path -LiteralPath $RepoRoot).Path
    $publicRootPath = (Resolve-Path -LiteralPath $PublicRoot).Path

    if ($ResolveStrictCandidatesFromScan) {
        $convertScriptPath = Join-Path $scriptDirectory 'convert-png-to-webp.ps1'
        Invoke-StrictCandidateResolution -RepoRootPath $repoRootPath -ReportPath $ScanReportPath -ConvertScriptPath $convertScriptPath -IsDryRun:$DryRun | Out-Null
        exit 0
    }

    if ($ApplyAllRewritableFromReport) {
        Invoke-ReportDrivenApply -RepoRootPath $repoRootPath -ReportPath $ScanReportPath -IsDryRun:$DryRun | Out-Null
        exit 0
    }

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
