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

function Is-StrictPathContext {
    param(
        [string]$LineText,
        [string]$MatchText
    )

    if ([string]::IsNullOrWhiteSpace($LineText) -or [string]::IsNullOrWhiteSpace($MatchText)) {
        return $false
    }

    $escaped = [System.Text.RegularExpressions.Regex]::Escape($MatchText)
    $quoted = '["' + "'" + '`]'

    # 1) import ... from '...png'
    $importFrom = '(?i)\bimport\b[^;\r\n]*\bfrom\s*' + $quoted + $escaped + $quoted
    if ($LineText -match $importFrom) { return $true }

    # 2) require('...png')
    $requireCall = '(?i)\brequire\s*\(\s*' + $quoted + $escaped + $quoted + '\s*\)'
    if ($LineText -match $requireCall) { return $true }

    # 3) <img src="...png">
    $imgSrc = '(?i)<img\b[^>]*\bsrc\s*=\s*["' + "'" + ']' + $escaped + '["' + "'" + ']'
    if ($LineText -match $imgSrc) { return $true }

    # 4) url(...png...)
    $cssUrl = '(?i)\burl\s*\(\s*["' + "'" + ']?' + $escaped + '["' + "'" + ']?\s*\)'
    if ($LineText -match $cssUrl) { return $true }

    # 5) Explicit property assignment with exact key name.
    $propBare = '(?i)(^|[,{]\s*)(src|image|thumbnail|background|icon)\s*:\s*' + $quoted + $escaped + $quoted
    if ($LineText -match $propBare) { return $true }
    $propQuoted = '(?i)(^|[,{]\s*)["' + "'" + '](src|image|thumbnail|background|icon)["' + "'" + ']\s*:\s*' + $quoted + $escaped + $quoted
    if ($LineText -match $propQuoted) { return $true }

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

function Resolve-ExistingPathCaseInsensitive {
    param([string]$AbsolutePath)

    try {
        if (Test-Path -LiteralPath $AbsolutePath) {
            return (Get-Item -LiteralPath $AbsolutePath).FullName
        }
    }
    catch { }

    return $null
}

function Add-DiagnosticCandidate {
    param(
        [System.Collections.Generic.List[object]]$Attempts,
        [hashtable]$Seen,
        [string]$Method,
        [string]$RepoRelativePath,
        [string]$RepoRootPath
    )

    if ([string]::IsNullOrWhiteSpace($RepoRelativePath)) { return }
    $normalized = (($RepoRelativePath -replace '\\', '/') -replace '/+', '/').TrimStart('/')
    if ([string]::IsNullOrWhiteSpace($normalized)) { return }

    $key = "$Method|$($normalized.ToLowerInvariant())"
    if ($Seen.ContainsKey($key)) { return }
    $Seen[$key] = $true

    $abs = Join-Path $RepoRootPath ($normalized -replace '/', [System.IO.Path]::DirectorySeparatorChar)
    $resolvedAbs = Resolve-ExistingPathCaseInsensitive -AbsolutePath $abs
    $exists = ($null -ne $resolvedAbs)
    $resolvedRel = if ($exists) { Normalize-RepoRelativePath -AbsolutePath $resolvedAbs -RepoRootPath $RepoRootPath } else { $normalized }

    $Attempts.Add([ordered]@{
        method = $Method
        candidateRelativePath = $normalized
        exists = $exists
        resolvedRelativePath = $resolvedRel
        resolvedFullPath = $resolvedAbs
    }) | Out-Null
}

function Resolve-PngPathDiagnostics {
    param(
        [string]$OriginalPathPart,
        [string]$FileAbsolutePath,
        [string]$RepoRootPath,
        [string]$CanonicalRoot
    )

    $pathPart = $OriginalPathPart
    while ($pathPart -match '^\$\{[^}]+\}') {
        $pathPart = [System.Text.RegularExpressions.Regex]::Replace($pathPart, '^\$\{[^}]+\}', '')
    }

    $attempts = New-Object System.Collections.Generic.List[object]
    $seen = @{}
    $canonicalPrefix = ($CanonicalRoot.Trim('/') + '/')

    if ($pathPart -match '\$\{' -or $pathPart -match '\{[^}]+\}') {
        return [pscustomobject]@{
            pngExistsAtResolvedPath = $false
            pngResolvedPath = $null
            pngResolutionMethod = 'DYNAMIC_TEMPLATE'
            pngResolutionAttempts = @($attempts.ToArray())
        }
    }

    $pathVariants = New-Object System.Collections.Generic.List[string]
    $pathVariants.Add($pathPart)
    try {
        $decoded = [System.Uri]::UnescapeDataString($pathPart)
        if ($decoded -ne $pathPart) {
            $pathVariants.Add($decoded)
        }
    }
    catch { }

    foreach ($rawVariant in $pathVariants) {
        $v = (($rawVariant -replace '\\', '/') -replace '/+', '/')
        if ([string]::IsNullOrWhiteSpace($v)) { continue }

        if ($v.StartsWith('/')) {
            Add-DiagnosticCandidate -Attempts $attempts -Seen $seen -Method 'ABS_LEADING_SLASH' -RepoRelativePath ($canonicalPrefix + $v.TrimStart('/')) -RepoRootPath $RepoRootPath
            Add-DiagnosticCandidate -Attempts $attempts -Seen $seen -Method 'ABS_ADD_PUBLIC' -RepoRelativePath ('public/' + $v.TrimStart('/')) -RepoRootPath $RepoRootPath
        }
        elseif ($v.StartsWith('public/', [System.StringComparison]::OrdinalIgnoreCase)) {
            Add-DiagnosticCandidate -Attempts $attempts -Seen $seen -Method 'AS_IS_PUBLIC' -RepoRelativePath $v -RepoRootPath $RepoRootPath
            Add-DiagnosticCandidate -Attempts $attempts -Seen $seen -Method 'STRIP_PUBLIC_TO_CANONICAL' -RepoRelativePath ($canonicalPrefix + $v.Substring(7)) -RepoRootPath $RepoRootPath
        }
        elseif ($v.StartsWith('./') -or $v.StartsWith('../')) {
            try {
                $abs = [System.IO.Path]::GetFullPath((Join-Path (Split-Path -Parent $FileAbsolutePath) $v))
                Add-DiagnosticCandidate -Attempts $attempts -Seen $seen -Method 'RELATIVE_TO_FILE' -RepoRelativePath (Normalize-RepoRelativePath -AbsolutePath $abs -RepoRootPath $RepoRootPath) -RepoRootPath $RepoRootPath
            }
            catch { }
            Add-DiagnosticCandidate -Attempts $attempts -Seen $seen -Method 'RELATIVE_ADD_CANONICAL' -RepoRelativePath ($canonicalPrefix + $v.TrimStart('./')) -RepoRootPath $RepoRootPath
        }
        else {
            Add-DiagnosticCandidate -Attempts $attempts -Seen $seen -Method 'ADD_CANONICAL' -RepoRelativePath ($canonicalPrefix + $v) -RepoRootPath $RepoRootPath
            Add-DiagnosticCandidate -Attempts $attempts -Seen $seen -Method 'ADD_PUBLIC' -RepoRelativePath ('public/' + $v) -RepoRootPath $RepoRootPath
            try {
                $abs = [System.IO.Path]::GetFullPath((Join-Path (Split-Path -Parent $FileAbsolutePath) $v))
                Add-DiagnosticCandidate -Attempts $attempts -Seen $seen -Method 'RESOLVE_RELATIVE_FILE' -RepoRelativePath (Normalize-RepoRelativePath -AbsolutePath $abs -RepoRootPath $RepoRootPath) -RepoRootPath $RepoRootPath
            }
            catch { }
        }
    }

    $resolved = $attempts | Where-Object { $_.exists } | Select-Object -First 1
    if ($null -ne $resolved) {
        return [pscustomobject]@{
            pngExistsAtResolvedPath = $true
            pngResolvedPath = [pscustomobject]@{
                relative = $resolved.resolvedRelativePath
                full = $resolved.resolvedFullPath
            }
            pngResolutionMethod = $resolved.method
            pngResolutionAttempts = @($attempts.ToArray())
        }
    }

    $fallback = $attempts | Select-Object -First 1
    return [pscustomobject]@{
        pngExistsAtResolvedPath = $false
        pngResolvedPath = if ($null -ne $fallback) { [pscustomobject]@{ relative = $fallback.candidateRelativePath; full = $null } } else { $null }
        pngResolutionMethod = if ($null -ne $fallback) { $fallback.method } else { 'UNRESOLVED' }
        pngResolutionAttempts = @($attempts.ToArray())
    }
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
    $webpIndex = @{}
    foreach ($file in $webpFiles) {
        $rel = Normalize-RepoRelativePath -AbsolutePath $file.FullName -RepoRootPath $repoRootPath
        $webpSet[$rel.ToLowerInvariant()] = $rel
        $base = [System.IO.Path]::GetFileNameWithoutExtension($rel).ToLowerInvariant()
        if (-not $webpIndex.ContainsKey($base)) {
            $webpIndex[$base] = New-Object System.Collections.Generic.List[string]
        }
        $webpIndex[$base].Add($rel)
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
            $pngExistsAtResolvedPath = $false
            $pngResolvedPath = $null
            $pngResolutionMethod = $null
            $pngResolutionAttempts = @()
            $movedOrPathMismatchCandidate = $false
            $remediationHint = $null

            if ($pathPart -match '^(?i)(https?:|data:)') {
                $classification = 'NON_PATH'
            }
            elseif (-not (Is-StrictPathContext -LineText $lineText -MatchText $matchedText)) {
                $classification = 'NON_PATH'
            }
            else {
                $diag = Resolve-PngPathDiagnostics -OriginalPathPart $pathPart -FileAbsolutePath $file.FullName -RepoRootPath $repoRootPath -CanonicalRoot $CanonicalWebpRoot
                $pngExistsAtResolvedPath = [bool]$diag.pngExistsAtResolvedPath
                $pngResolvedPath = $diag.pngResolvedPath
                $pngResolutionMethod = $diag.pngResolutionMethod
                $pngResolutionAttempts = @($diag.pngResolutionAttempts)

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

            if ($classification -eq 'MISSING_WEBP') {
                $base = [System.IO.Path]::GetFileNameWithoutExtension($pathPart).ToLowerInvariant()
                if ($webpIndex.ContainsKey($base) -and $webpIndex[$base].Count -eq 1) {
                    $uniqueWebp = [string]$webpIndex[$base][0]
                    $siblingPng = [System.Text.RegularExpressions.Regex]::Replace($uniqueWebp, '(?i)\.webp$', '.png')
                    $siblingPngAbs = Join-Path $repoRootPath ($siblingPng -replace '/', [System.IO.Path]::DirectorySeparatorChar)
                    if (Test-Path -LiteralPath $siblingPngAbs) {
                        $movedOrPathMismatchCandidate = $true
                        $remediationHint = 'MOVED_OR_PATH_MISMATCH_CANDIDATE'
                        $candidateWebpPaths = @($uniqueWebp)
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
                pngExistsAtResolvedPath = $pngExistsAtResolvedPath
                pngResolvedPath = $pngResolvedPath
                pngResolutionMethod = $pngResolutionMethod
                pngResolutionAttempts = @($pngResolutionAttempts)
                movedOrPathMismatchCandidate = $movedOrPathMismatchCandidate
                remediationHint = $remediationHint
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
    $candidatePaths = [int]$classificationCounts.REWRITABLE + [int]$classificationCounts.MISSING_WEBP + [int]$classificationCounts.AMBIGUOUS
    Write-Host '=== STRICT PATH SCAN RESULT ==='
    Write-Host "TOTAL_PNG_MATCHES: $($report.totals.pngMatches)"
    Write-Host "CANDIDATE_PATHS: $candidatePaths"
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
