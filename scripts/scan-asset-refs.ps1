[CmdletBinding()]
param(
    [string]$RepoRoot,
    [string]$CanonicalWebpRoot,
    [string]$ProbePath,
    [string]$OutPath
)

$ErrorActionPreference = 'Stop'
$scriptDirectory = Split-Path -Parent $PSCommandPath

if ([string]::IsNullOrWhiteSpace($RepoRoot)) {
    $RepoRoot = Join-Path $scriptDirectory '..'
}
if ([string]::IsNullOrWhiteSpace($ProbePath)) {
    $ProbePath = Join-Path $scriptDirectory '.tmp\webp-probe.json'
}
if ([string]::IsNullOrWhiteSpace($OutPath)) {
    $OutPath = Join-Path $scriptDirectory '.tmp\asset-ref-scan.json'
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

function Is-LikelyNonPathContext {
    param(
        [string]$LineText,
        [string]$MatchText
    )

    $trimmed = $LineText.TrimStart()
    if ($trimmed.StartsWith('//') -or $trimmed.StartsWith('*') -or $trimmed.StartsWith('#')) {
        return $true
    }

    $matchPos = $LineText.IndexOf($MatchText, [System.StringComparison]::OrdinalIgnoreCase)
    if ($matchPos -ge 0) {
        $before = $LineText.Substring(0, $matchPos)
        if ($before.Contains('//')) {
            return $true
        }
    }

    return $false
}

function Build-ReplacementLiteral {
    param(
        [string]$OriginalPathPart,
        [string]$Tail,
        [string]$ResolvedWebpRepoRel,
        [string]$CanonicalRoot,
        [string]$FileAbsolutePath,
        [string]$RepoRootPath
    )

    $pathPart = $OriginalPathPart
    $prefix = ''
    while ($pathPart -match '^\$\{[^}]+\}') {
        $token = [System.Text.RegularExpressions.Regex]::Match($pathPart, '^\$\{[^}]+\}').Value
        $prefix += $token
        $pathPart = $pathPart.Substring($token.Length)
    }

    if ($pathPart -match '\$\{' -or $pathPart -match '\{[^}]+\}') {
        return $null
    }

    $resolvedNorm = $ResolvedWebpRepoRel
    if ($resolvedNorm -match '^(?i)public/') {
        $resolvedInsideCanonical = $resolvedNorm.Substring(7)
    }
    else {
        $resolvedInsideCanonical = $resolvedNorm
    }
    $resolvedInsideCanonical = ($resolvedInsideCanonical -replace '\\', '/')

    $replacementPath = $null
    if ($OriginalPathPart.StartsWith('/')) {
        $replacementPath = '/' + $resolvedInsideCanonical.TrimStart('/')
    }
    elseif ($OriginalPathPart.StartsWith('public/', [System.StringComparison]::OrdinalIgnoreCase)) {
        $replacementPath = 'public/' + $resolvedInsideCanonical.TrimStart('/')
    }
    elseif ($OriginalPathPart.StartsWith('./') -or $OriginalPathPart.StartsWith('../')) {
        $fileDir = Split-Path -Parent $FileAbsolutePath
        $resolvedAbs = Join-Path $RepoRootPath ($ResolvedWebpRepoRel -replace '/', [System.IO.Path]::DirectorySeparatorChar)
        try {
            $baseUri = [System.Uri]((Resolve-Path -LiteralPath $fileDir).Path + [System.IO.Path]::DirectorySeparatorChar)
            $targetUri = [System.Uri]([System.IO.Path]::GetFullPath($resolvedAbs))
            $rel = [System.Uri]::UnescapeDataString($baseUri.MakeRelativeUri($targetUri).ToString()) -replace '\\', '/'
            $replacementPath = $rel
        }
        catch {
            return $null
        }
    }
    else {
        if ([string]::IsNullOrWhiteSpace($prefix)) {
            $replacementPath = $resolvedInsideCanonical
        }
        else {
            $replacementPath = $resolvedInsideCanonical
        }
    }

    if ([string]::IsNullOrWhiteSpace($replacementPath)) {
        return $null
    }

    return ($prefix + $replacementPath + $Tail)
}

function Get-FileScope {
    param([string]$RepoRootPath)

    $allowedExtensions = @('.js', '.jsx', '.ts', '.tsx', '.css', '.scss', '.html', '.json', '.md', '.glsl')
    $map = @{}

    $roots = @(
        (Join-Path $RepoRootPath 'src'),
        (Join-Path $RepoRootPath 'public')
    )
    foreach ($root in $roots) {
        if (-not (Test-Path -LiteralPath $root)) { continue }
        Get-ChildItem -LiteralPath $root -Recurse -File | Where-Object {
            $ext = $_.Extension.ToLowerInvariant()
            $allowedExtensions -contains $ext
        } | ForEach-Object { $map[$_.FullName] = $_ }
    }

    $indexPath = Join-Path $RepoRootPath 'index.html'
    if (Test-Path -LiteralPath $indexPath) {
        $map[$indexPath] = (Get-Item -LiteralPath $indexPath)
    }

    return $map.Values
}

try {
    $repoRootPath = (Resolve-Path -LiteralPath $RepoRoot).Path
    $probe = $null
    if (Test-Path -LiteralPath $ProbePath) {
        $probe = (Get-Content -LiteralPath $ProbePath -Raw | ConvertFrom-Json)
    }

    if ([string]::IsNullOrWhiteSpace($CanonicalWebpRoot)) {
        if ($null -ne $probe -and -not [string]::IsNullOrWhiteSpace($probe.canonicalRoot)) {
            $CanonicalWebpRoot = [string]$probe.canonicalRoot
        }
        else {
            $CanonicalWebpRoot = 'public'
        }
    }

    $webpFiles = Get-ChildItem -LiteralPath $repoRootPath -Recurse -File | Where-Object {
        $_.Extension -ieq '.webp' -and $_.FullName -notmatch '[\\/](node_modules|dist|\.git)[\\/]'
    }
    $webpSet = @{}
    foreach ($file in $webpFiles) {
        $rel = Normalize-RepoRelativePath -AbsolutePath $file.FullName -RepoRootPath $repoRootPath
        $webpSet[$rel.ToLowerInvariant()] = $rel
    }

    $files = Get-FileScope -RepoRootPath $repoRootPath
    $pattern = '(?i)(?<path>[^\s"' + "'" + '`\r\n<>\(\)][^"' + "'" + '`\r\n<>\(\)]*?\.png)(?<tail>(?:\?[^"' + "'" + '`\s<>\)]*)?(?:#[^"' + "'" + '`\s<>\)]*)?)'

    $matchesOut = New-Object System.Collections.Generic.List[object]
    $classificationCounts = @{
        REWRITABLE = 0
        MISSING_WEBP = 0
        AMBIGUOUS = 0
        NON_PATH = 0
    }
    $filePngCounts = @{}
    $ambiguousBaseCounts = @{}

    foreach ($file in $files) {
        $content = Get-Content -LiteralPath $file.FullName -Raw
        if ($null -eq $content) { continue }

        $lineStarts = New-Object System.Collections.Generic.List[int]
        $lineStarts.Add(0)
        for ($i = 0; $i -lt $content.Length; $i++) {
            if ($content[$i] -eq "`n") {
                $lineStarts.Add($i + 1)
            }
        }

        $regexMatches = [System.Text.RegularExpressions.Regex]::Matches($content, $pattern)
        foreach ($m in $regexMatches) {
            $pathPart = $m.Groups['path'].Value
            $tail = $m.Groups['tail'].Value
            $matchedText = $m.Value

            $lineNumber = 1
            $column = 1
            for ($i = 0; $i -lt $lineStarts.Count; $i++) {
                if ($lineStarts[$i] -le $m.Index) {
                    $lineNumber = $i + 1
                    $column = $m.Index - $lineStarts[$i] + 1
                }
                else {
                    break
                }
            }

            $lineStartIdx = $lineStarts[$lineNumber - 1]
            $lineEndIdx = $content.IndexOf("`n", $lineStartIdx)
            if ($lineEndIdx -lt 0) { $lineEndIdx = $content.Length }
            $lineText = $content.Substring($lineStartIdx, $lineEndIdx - $lineStartIdx)

            $classification = $null
            $resolvedWebpPath = $null
            $candidateWebpPaths = @()
            $normalizedPathGuess = $null
            $replacementLiteral = $null

            if ($pathPart -match '^(?i)(https?:|data:)') {
                $classification = 'NON_PATH'
            }
            elseif (Is-LikelyNonPathContext -LineText $lineText -MatchText $matchedText) {
                $classification = 'NON_PATH'
            }
            else {
                $prefixStripped = $pathPart
                while ($prefixStripped -match '^\$\{[^}]+\}') {
                    $prefixStripped = [System.Text.RegularExpressions.Regex]::Replace($prefixStripped, '^\$\{[^}]+\}', '')
                }

                if ($prefixStripped -match '\$\{' -or $prefixStripped -match '\{[^}]+\}') {
                    $classification = 'AMBIGUOUS'
                }
                else {
                    $canonicalPrefix = ($CanonicalWebpRoot.Trim('/') + '/')
                    $candidates = New-Object System.Collections.Generic.List[string]
                    $addCandidate = {
                        param([string]$v)
                        if ([string]::IsNullOrWhiteSpace($v)) { return }
                        $n = ($v -replace '\\', '/').TrimStart('/')
                        if (-not [string]::IsNullOrWhiteSpace($n) -and -not $candidates.Contains($n)) {
                            $candidates.Add($n)
                        }
                    }

                    if ($prefixStripped.StartsWith('/')) {
                        & $addCandidate ($canonicalPrefix + $prefixStripped.TrimStart('/'))
                    }
                    elseif ($prefixStripped.StartsWith('public/', [System.StringComparison]::OrdinalIgnoreCase)) {
                        & $addCandidate $prefixStripped
                    }
                    elseif ($prefixStripped.StartsWith('./') -or $prefixStripped.StartsWith('../')) {
                        try {
                            $abs = [System.IO.Path]::GetFullPath((Join-Path $file.DirectoryName $prefixStripped))
                            & $addCandidate (Normalize-RepoRelativePath -AbsolutePath $abs -RepoRootPath $repoRootPath)
                        }
                        catch { }
                    }
                    else {
                        & $addCandidate ($canonicalPrefix + $prefixStripped)
                        try {
                            $abs = [System.IO.Path]::GetFullPath((Join-Path $file.DirectoryName $prefixStripped))
                            & $addCandidate (Normalize-RepoRelativePath -AbsolutePath $abs -RepoRootPath $repoRootPath)
                        }
                        catch { }
                    }

                    if ($candidates.Count -gt 0) {
                        $normalizedPathGuess = $candidates[0]
                    }

                    $found = New-Object System.Collections.Generic.List[string]
                    foreach ($candidate in $candidates) {
                        $webpCandidate = [System.Text.RegularExpressions.Regex]::Replace($candidate, '(?i)\.png$', '.webp')
                        $key = $webpCandidate.ToLowerInvariant()
                        if ($webpSet.ContainsKey($key) -and -not $found.Contains($webpSet[$key])) {
                            $found.Add($webpSet[$key])
                        }
                    }

                    if ($found.Count -eq 0) {
                        $classification = 'MISSING_WEBP'
                    }
                    elseif ($found.Count -eq 1) {
                        $classification = 'REWRITABLE'
                        $resolvedWebpPath = $found[0]
                        $replacementLiteral = Build-ReplacementLiteral -OriginalPathPart $pathPart -Tail $tail -ResolvedWebpRepoRel $resolvedWebpPath -CanonicalRoot $CanonicalWebpRoot -FileAbsolutePath $file.FullName -RepoRootPath $repoRootPath
                        if ([string]::IsNullOrWhiteSpace($replacementLiteral)) {
                            $classification = 'AMBIGUOUS'
                            $candidateWebpPaths = @($found)
                            $resolvedWebpPath = $null
                        }
                    }
                    else {
                        $classification = 'AMBIGUOUS'
                        $candidateWebpPaths = @($found)
                    }
                }
            }

            $classificationCounts[$classification]++
            $fileRel = Normalize-RepoRelativePath -AbsolutePath $file.FullName -RepoRootPath $repoRootPath
            if (-not $filePngCounts.ContainsKey($fileRel)) { $filePngCounts[$fileRel] = 0 }
            $filePngCounts[$fileRel]++

            if ($classification -eq 'AMBIGUOUS') {
                $base = [System.IO.Path]::GetFileNameWithoutExtension($pathPart).ToLowerInvariant()
                if (-not $ambiguousBaseCounts.ContainsKey($base)) { $ambiguousBaseCounts[$base] = 0 }
                $ambiguousBaseCounts[$base]++
            }

            $matchesOut.Add([ordered]@{
                file = $fileRel
                line = $lineNumber
                column = $column
                matchIndex = $m.Index
                spanStart = $m.Index
                spanLength = $m.Length
                matchedText = $matchedText
                originalLiteral = $matchedText
                normalizedPathGuess = $normalizedPathGuess
                classification = $classification
                resolvedWebpPath = $resolvedWebpPath
                candidateWebpPaths = @($candidateWebpPaths)
                replacementLiteral = $replacementLiteral
            }) | Out-Null
        }
    }

    $topFiles = $filePngCounts.GetEnumerator() | Sort-Object Value -Descending | Select-Object -First 20 | ForEach-Object {
        [ordered]@{ file = $_.Key; pngRefs = $_.Value }
    }
    $topAmbiguous = $ambiguousBaseCounts.GetEnumerator() | Sort-Object Value -Descending | Select-Object -First 20 | ForEach-Object {
        [ordered]@{ basename = $_.Key; count = $_.Value }
    }

    $report = @{
        generatedAt = (Get-Date).ToString('o')
        repoRoot = $repoRootPath
        canonicalWebpRoot = $CanonicalWebpRoot
        totals = @{
            pngMatches = $matchesOut.Count
        }
        countsByClassification = $classificationCounts
        topFilesByPngRefs = @($topFiles)
        topAmbiguousBasenames = @($topAmbiguous)
        matches = @($matchesOut.ToArray())
    }

    $outDir = Split-Path -Parent $OutPath
    if (-not (Test-Path -LiteralPath $outDir)) {
        New-Item -ItemType Directory -Path $outDir -Force | Out-Null
    }
    $report | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $OutPath -Encoding UTF8

    Write-Host "scan report: $OutPath"
    Write-Host "total .png matches: $($report.totals.pngMatches)"
    Write-Host "REWRITABLE: $($classificationCounts.REWRITABLE)"
    Write-Host "MISSING_WEBP: $($classificationCounts.MISSING_WEBP)"
    Write-Host "AMBIGUOUS: $($classificationCounts.AMBIGUOUS)"
    Write-Host "NON_PATH: $($classificationCounts.NON_PATH)"
    Write-Host 'top files by png refs:'
    foreach ($row in $topFiles | Select-Object -First 10) {
        Write-Host "  $($row.file): $($row.pngRefs)"
    }
    exit 0
}
catch {
    Write-Error $_
    exit 1
}
