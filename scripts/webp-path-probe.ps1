[CmdletBinding()]
param(
    [string]$RepoRoot,
    [string]$OutPath
)

$ErrorActionPreference = 'Stop'
$scriptDirectory = Split-Path -Parent $PSCommandPath

if ([string]::IsNullOrWhiteSpace($RepoRoot)) {
    $RepoRoot = Join-Path $scriptDirectory '..'
}

if ([string]::IsNullOrWhiteSpace($OutPath)) {
    $OutPath = Join-Path $scriptDirectory '.tmp\webp-probe.json'
}

function Normalize-RepoRelativePath {
    param(
        [string]$AbsolutePath,
        [string]$RepoRootPath
    )

    $repoPrefix = [System.IO.Path]::GetFullPath($RepoRootPath)
    if (-not $repoPrefix.EndsWith([System.IO.Path]::DirectorySeparatorChar)) {
        $repoPrefix += [System.IO.Path]::DirectorySeparatorChar
    }

    $full = [System.IO.Path]::GetFullPath($AbsolutePath)
    if ($full.StartsWith($repoPrefix, [System.StringComparison]::OrdinalIgnoreCase)) {
        $relative = $full.Substring($repoPrefix.Length)
    }
    else {
        $relative = $full
    }

    return ($relative -replace '\\', '/')
}

function Get-ScopeFiles {
    param([string]$RepoRootPath)

    $allowedExtensions = @('.js', '.jsx', '.ts', '.tsx', '.css', '.scss', '.html', '.json', '.md', '.glsl')
    $files = New-Object System.Collections.Generic.List[object]

    $scanRoots = @(
        (Join-Path $RepoRootPath 'src'),
        (Join-Path $RepoRootPath 'public')
    )
    foreach ($scanRoot in $scanRoots) {
        if (-not (Test-Path -LiteralPath $scanRoot)) {
            continue
        }
        Get-ChildItem -LiteralPath $scanRoot -Recurse -File | Where-Object {
            $ext = $_.Extension.ToLowerInvariant()
            $allowedExtensions -contains $ext
        } | ForEach-Object { $files.Add($_) }
    }

    $indexPath = Join-Path $RepoRootPath 'index.html'
    if (Test-Path -LiteralPath $indexPath) {
        $files.Add((Get-Item -LiteralPath $indexPath))
    }

    return $files
}

function Resolve-CandidateToWebp {
    param(
        [string]$CandidatePath,
        [string]$FileDir,
        [string]$RepoRootPath,
        [string]$CanonicalRoot,
        [hashtable]$WebpSet
    )

    $pathPart = $CandidatePath
    while ($pathPart -match '^\$\{[^}]+\}') {
        $pathPart = [System.Text.RegularExpressions.Regex]::Replace($pathPart, '^\$\{[^}]+\}', '')
    }

    if ($pathPart -match '\$\{' -or $pathPart -match '\{[^}]+\}') {
        return $null
    }

    $pathPart = ($pathPart -replace '\\', '/')
    $canonicalPrefix = ($CanonicalRoot.Trim('/') + '/')
    $candidates = New-Object System.Collections.Generic.List[string]

    $addCandidate = {
        param([string]$repoRel)
        if ([string]::IsNullOrWhiteSpace($repoRel)) { return }
        $norm = (($repoRel -replace '\\', '/').TrimStart('/'))
        if (-not [string]::IsNullOrWhiteSpace($norm)) {
            $candidates.Add($norm)
        }
    }

    if ($pathPart.StartsWith('/')) {
        & $addCandidate ($canonicalPrefix + $pathPart.TrimStart('/'))
    }
    elseif ($pathPart.StartsWith('public/', [System.StringComparison]::OrdinalIgnoreCase)) {
        & $addCandidate $pathPart
    }
    elseif ($pathPart.StartsWith('./') -or $pathPart.StartsWith('../')) {
        try {
            $abs = [System.IO.Path]::GetFullPath((Join-Path $FileDir $pathPart))
            & $addCandidate (Normalize-RepoRelativePath -AbsolutePath $abs -RepoRootPath $RepoRootPath)
        }
        catch { }
    }
    else {
        & $addCandidate ($canonicalPrefix + $pathPart)
        try {
            $abs = [System.IO.Path]::GetFullPath((Join-Path $FileDir $pathPart))
            & $addCandidate (Normalize-RepoRelativePath -AbsolutePath $abs -RepoRootPath $RepoRootPath)
        }
        catch { }
    }

    foreach ($candidate in $candidates) {
        $webpCandidate = [System.Text.RegularExpressions.Regex]::Replace($candidate, '(?i)\.png$', '.webp')
        $key = $webpCandidate.ToLowerInvariant()
        if ($WebpSet.ContainsKey($key)) {
            return $WebpSet[$key]
        }
    }

    return $null
}

try {
    $repoRootPath = (Resolve-Path -LiteralPath $RepoRoot).Path
    $allFiles = Get-ChildItem -LiteralPath $repoRootPath -Recurse -File | Where-Object {
        $_.FullName -notmatch '[\\/](node_modules|dist|\.git)[\\/]'
    }

    $webpFiles = $allFiles | Where-Object { $_.Extension -ieq '.webp' }
    $pngPublicFiles = Get-ChildItem -LiteralPath (Join-Path $repoRootPath 'public') -Recurse -File -ErrorAction SilentlyContinue | Where-Object { $_.Extension -ieq '.png' }

    $webpRelPaths = @()
    $webpSet = @{}
    $webpIndex = @{}
    foreach ($file in $webpFiles) {
        $rel = Normalize-RepoRelativePath -AbsolutePath $file.FullName -RepoRootPath $repoRootPath
        $webpRelPaths += $rel
        $webpSet[$rel.ToLowerInvariant()] = $rel

        $base = [System.IO.Path]::GetFileNameWithoutExtension($rel).ToLowerInvariant()
        if (-not $webpIndex.ContainsKey($base)) {
            $webpIndex[$base] = New-Object System.Collections.Generic.List[string]
        }
        $webpIndex[$base].Add($rel)
    }

    $webpTopDirs = $webpRelPaths | Group-Object {
        $dir = Split-Path -Path $_ -Parent
        if ([string]::IsNullOrWhiteSpace($dir)) { '.' } else { $dir }
    } | Sort-Object Count -Descending | Select-Object -First 10

    $pngRelPaths = @()
    foreach ($file in $pngPublicFiles) {
        $pngRelPaths += (Normalize-RepoRelativePath -AbsolutePath $file.FullName -RepoRootPath $repoRootPath)
    }
    $pngTopDirs = $pngRelPaths | Group-Object {
        $dir = Split-Path -Path $_ -Parent
        if ([string]::IsNullOrWhiteSpace($dir)) { '.' } else { $dir }
    } | Sort-Object Count -Descending | Select-Object -First 10

    $webpTotal = $webpFiles.Count
    $publicShare = if ($webpTotal -gt 0) { (($webpRelPaths | Where-Object { $_ -like 'public/*' }).Count / $webpTotal) } else { 0 }
    $srcShare = if ($webpTotal -gt 0) { (($webpRelPaths | Where-Object { $_ -like 'src/*' }).Count / $webpTotal) } else { 0 }
    $assetsShare = if ($webpTotal -gt 0) { (($webpRelPaths | Where-Object { $_ -like 'assets/*' }).Count / $webpTotal) } else { 0 }

    $canonicalRoot = 'MIXED'
    if ($publicShare -gt 0.8) { $canonicalRoot = 'public' }
    elseif ($srcShare -gt 0.8) { $canonicalRoot = 'src' }
    elseif ($assetsShare -gt 0.8) { $canonicalRoot = 'assets' }

    $sampleSize = [Math]::Min(10, $webpRelPaths.Count)
    $webpSamples = @()
    if ($sampleSize -gt 0) {
        $webpSamples = $webpRelPaths | Get-Random -Count $sampleSize
    }

    $mustMove = $null
    if ($canonicalRoot -ne 'MIXED') {
        $scopeFiles = Get-ScopeFiles -RepoRootPath $repoRootPath
        $pattern = '(?i)(?<path>[^\s"' + "'" + '`\r\n<>\(\)][^"' + "'" + '`\r\n<>\(\)]*?\.png)(?<tail>(?:\?[^"' + "'" + '`\s<>\)]*)?(?:#[^"' + "'" + '`\s<>\)]*)?)'
        foreach ($scopeFile in $scopeFiles) {
            $content = Get-Content -LiteralPath $scopeFile.FullName -Raw
            if ($null -eq $content) { continue }
            $matches = [System.Text.RegularExpressions.Regex]::Matches($content, $pattern)
            foreach ($match in $matches) {
                $pathPart = $match.Groups['path'].Value
                $resolved = Resolve-CandidateToWebp -CandidatePath $pathPart -FileDir $scopeFile.DirectoryName -RepoRootPath $repoRootPath -CanonicalRoot $canonicalRoot -WebpSet $webpSet
                if ($null -ne $resolved) {
                    $line = ([System.Text.RegularExpressions.Regex]::Matches($content.Substring(0, $match.Index), "`n")).Count + 1
                    $mustMove = [ordered]@{
                        file = (Normalize-RepoRelativePath -AbsolutePath $scopeFile.FullName -RepoRootPath $repoRootPath)
                        line = $line
                        originalPath = $pathPart
                        resolvedWebpPath = $resolved
                    }
                    break
                }
            }
            if ($null -ne $mustMove) { break }
        }
    }

    $webpIndexObj = @{}
    foreach ($key in $webpIndex.Keys) {
        $webpIndexObj[$key] = @($webpIndex[$key])
    }

    $probe = [ordered]@{
        generatedAt = (Get-Date).ToString('o')
        canonicalRoot = $canonicalRoot
        totals = [ordered]@{
            webp = $webpTotal
            publicPng = $pngPublicFiles.Count
        }
        shares = [ordered]@{
            public = [Math]::Round($publicShare, 4)
            src = [Math]::Round($srcShare, 4)
            assets = [Math]::Round($assetsShare, 4)
        }
        webpTopDirectories = @($webpTopDirs | ForEach-Object { [ordered]@{ directory = $_.Name; count = $_.Count } })
        publicPngTopDirectories = @($pngTopDirs | ForEach-Object { [ordered]@{ directory = $_.Name; count = $_.Count } })
        webpSamples = @($webpSamples)
        webpIndex = $webpIndexObj
        mustMove = if ($null -ne $mustMove) { $mustMove } else { 'NO_REWRITABLE_SAMPLE_FOUND' }
    }

    $outDir = Split-Path -Parent $OutPath
    if (-not (Test-Path -LiteralPath $outDir)) {
        New-Item -ItemType Directory -Path $outDir -Force | Out-Null
    }
    $probe | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $OutPath -Encoding UTF8

    Write-Host "webp total: $webpTotal"
    Write-Host 'top webp directories:'
    foreach ($row in $probe.webpTopDirectories) {
        Write-Host "  $($row.directory): $($row.count)"
    }
    Write-Host "public png total: $($pngPublicFiles.Count)"
    Write-Host "canonical root candidate: $canonicalRoot"
    if ($probe.mustMove -is [string]) {
        Write-Host $probe.mustMove
    }
    else {
        Write-Host ("must-move probe: " + $probe.mustMove.file + ":" + $probe.mustMove.line + " -> " + $probe.mustMove.resolvedWebpPath)
    }
    Write-Host "probe report: $OutPath"
    exit 0
}
catch {
    Write-Error $_
    exit 1
}
