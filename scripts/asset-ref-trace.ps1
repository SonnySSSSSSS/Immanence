[CmdletBinding()]
param(
    [string]$RepoRoot,
    [string]$ScanReportPath,
    [string]$OutPath,
    [string]$FixPlanPath,
    [int]$Take = 25,
    [switch]$Apply,
    [switch]$DryRun
)

$ErrorActionPreference = 'Stop'
$scriptDirectory = Split-Path -Parent $PSCommandPath

if ([string]::IsNullOrWhiteSpace($RepoRoot)) {
    $RepoRoot = Join-Path $scriptDirectory '..'
}
if ([string]::IsNullOrWhiteSpace($ScanReportPath)) {
    $ScanReportPath = Join-Path $scriptDirectory '.tmp\asset-ref-scan.json'
}
if ([string]::IsNullOrWhiteSpace($OutPath)) {
    $OutPath = Join-Path $scriptDirectory '.tmp\asset-ref-trace.json'
}
if ([string]::IsNullOrWhiteSpace($FixPlanPath)) {
    $FixPlanPath = Join-Path $scriptDirectory '.tmp\asset-ref-fix-plan.json'
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

function Parse-Literal {
    param([string]$Literal)

    $pattern = '(?i)^(?<path>[^\s"' + "'" + '`\r\n<>\(\)][^"' + "'" + '`\r\n<>\(\)]*?\.png)(?<tail>(?:\?[^"' + "'" + '`\s<>\)]*)?(?:#[^"' + "'" + '`\s<>\)]*)?)$'
    $m = [System.Text.RegularExpressions.Regex]::Match($Literal, $pattern)
    if (-not $m.Success) {
        return $null
    }

    return [pscustomobject]@{
        pathPart = [string]$m.Groups['path'].Value
        tail = [string]$m.Groups['tail'].Value
    }
}

function Get-RefStyle {
    param(
        [string]$Literal,
        [string]$LineText
    )

    if ($LineText -match '(?i)url\s*\(') {
        return 'CSS_URL'
    }
    if ($Literal -match '\$\{' -or $Literal -match '\{[^}]+\}') {
        return 'TEMPLATE'
    }

    $parsed = Parse-Literal -Literal $Literal
    if ($null -eq $parsed) {
        return 'PUBLIC_URL_RELATIVE'
    }

    $p = $parsed.pathPart
    if ($p.StartsWith('./') -or $p.StartsWith('../')) {
        return 'MODULE_RELATIVE'
    }
    if ($p.StartsWith('/')) {
        return 'PUBLIC_URL_ABSOLUTE'
    }
    return 'PUBLIC_URL_RELATIVE'
}

function Get-ContextLines {
    param(
        [string]$FileAbs,
        [int]$Line,
        [int]$Radius = 3
    )

    if (-not (Test-Path -LiteralPath $FileAbs)) {
        return @()
    }

    $lines = Get-Content -LiteralPath $FileAbs
    if ($null -eq $lines) { return @() }

    $start = [Math]::Max(1, $Line - $Radius)
    $end = [Math]::Min($lines.Count, $Line + $Radius)

    $out = New-Object System.Collections.Generic.List[object]
    for ($i = $start; $i -le $end; $i++) {
        $out.Add([ordered]@{
            line = $i
            text = [string]$lines[$i - 1]
        }) | Out-Null
    }
    return @($out.ToArray())
}

function Resolve-DeterministicReplacement {
    param(
        [pscustomobject]$Match,
        [string]$FileAbs,
        [string]$RepoRootPath
    )

    $literal = [string]$Match.originalLiteral
    $parsed = Parse-Literal -Literal $literal
    if ($null -eq $parsed) {
        return $null
    }

    $pathPart = [string]$parsed.pathPart
    $tail = [string]$parsed.tail

    if ($pathPart -match '\$\{' -or $pathPart -match '\{[^}]+\}') {
        return $null
    }

    $style = Get-RefStyle -Literal $literal -LineText ([string]$Match.lineText
    )

    # S1: deterministic module-relative fix only when same target path with .webp exists.
    if ($style -eq 'MODULE_RELATIVE') {
        try {
            $absPng = [System.IO.Path]::GetFullPath((Join-Path (Split-Path -Parent $FileAbs) $pathPart))
            $absWebp = [System.Text.RegularExpressions.Regex]::Replace($absPng, '(?i)\.png$', '.webp')
            if ((-not (Test-Path -LiteralPath $absPng)) -and (Test-Path -LiteralPath $absWebp)) {
                $replacementLiteral = [System.Text.RegularExpressions.Regex]::Replace($pathPart, '(?i)\.png$', '.webp') + $tail
                $evidenceRel = Normalize-RepoRelativePath -AbsolutePath $absWebp -RepoRootPath $RepoRootPath
                return [pscustomobject]@{
                    replacementLiteral = $replacementLiteral
                    reason = 'S1_MODULE_RELATIVE_EXTENSION_MATCH'
                    evidencePath = $evidenceRel
                }
            }
        }
        catch { }
        return $null
    }

    # S2: deterministic public-url fix when exact normalized public path exists as .webp.
    $normalized = $pathPart
    $prefixTokens = ''
    while ($normalized -match '^\$\{[^}]+\}') {
        $token = [System.Text.RegularExpressions.Regex]::Match($normalized, '^\$\{[^}]+\}').Value
        $prefixTokens += $token
        $normalized = $normalized.Substring($token.Length)
    }

    if ($normalized.StartsWith('/')) {
        $publicRel = 'public/' + $normalized.TrimStart('/')
    }
    elseif ($normalized.StartsWith('public/', [System.StringComparison]::OrdinalIgnoreCase)) {
        $publicRel = $normalized
    }
    else {
        $publicRel = 'public/' + $normalized.TrimStart('/')
    }

    $publicRel = (($publicRel -replace '\\', '/') -replace '/+', '/')
    $webpRel = [System.Text.RegularExpressions.Regex]::Replace($publicRel, '(?i)\.png$', '.webp')
    $webpAbs = Join-Path $RepoRootPath ($webpRel -replace '/', [System.IO.Path]::DirectorySeparatorChar)

    if (Test-Path -LiteralPath $webpAbs) {
        $replacementLiteral = [System.Text.RegularExpressions.Regex]::Replace($pathPart, '(?i)\.png$', '.webp') + $tail
        $evidenceRel = Normalize-RepoRelativePath -AbsolutePath $webpAbs -RepoRootPath $RepoRootPath
        return [pscustomobject]@{
            replacementLiteral = $replacementLiteral
            reason = 'S2_PUBLIC_URL_EXTENSION_MATCH'
            evidencePath = $evidenceRel
        }
    }

    return $null
}

function Invoke-ApplyFixPlan {
    param(
        [string]$RepoRootPath,
        [string]$PlanPath,
        [switch]$IsDryRun
    )

    if (-not (Test-Path -LiteralPath $PlanPath)) {
        throw "Fix plan not found: $PlanPath"
    }

    $planDoc = Get-Content -LiteralPath $PlanPath -Raw | ConvertFrom-Json
    if ($null -eq $planDoc -or $null -eq $planDoc.fixes) {
        throw "Invalid fix plan format: $PlanPath"
    }

    $fixes = @($planDoc.fixes)
    if ($fixes.Count -eq 0) {
        Write-Host 'Fix plan has 0 fixes; nothing to apply.'
        return [ordered]@{ filesTouched = 0; replacementsApplied = 0; conflictsSkipped = 0 }
    }

    $grouped = $fixes | Group-Object file
    $utf8NoBom = New-Object System.Text.UTF8Encoding($false)

    $filesTouched = 0
    $replacementsApplied = 0
    $conflictsSkipped = 0

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
        $ordered = @($group.Group | Sort-Object { [int]$_.spanStart } -Descending)
        foreach ($fix in $ordered) {
            $start = [int]$fix.spanStart
            $len = [int]$fix.spanLength
            $expected = [string]$fix.originalLiteral
            $replacement = [string]$fix.replacementLiteral

            if ($start -lt 0 -or $len -lt 0 -or ($start + $len) -gt $content.Length) {
                $conflictsSkipped++
                continue
            }
            if ([string]::IsNullOrWhiteSpace($replacement)) {
                $conflictsSkipped++
                continue
            }

            $slice = $content.Substring($start, $len)
            if ($slice -cne $expected) {
                $conflictsSkipped++
                continue
            }

            $content = $content.Substring(0, $start) + $replacement + $content.Substring($start + $len)
            $fileChanges++
        }

        if ($fileChanges -gt 0) {
            $filesTouched++
            $replacementsApplied += $fileChanges
            if ($IsDryRun) {
                Write-Host "DRY-RUN: $fileRel ($fileChanges replacements)"
            }
            else {
                [System.IO.File]::WriteAllText($fileAbs, $content, $utf8NoBom)
                Write-Host "UPDATED: $fileRel ($fileChanges replacements)"
            }
        }
    }

    Write-Host "Summary: filesTouched=$filesTouched replacementsApplied=$replacementsApplied conflictsSkipped=$conflictsSkipped mode=$([string](if ($IsDryRun) { 'dry-run' } else { 'apply' }))"
    return [ordered]@{
        filesTouched = $filesTouched
        replacementsApplied = $replacementsApplied
        conflictsSkipped = $conflictsSkipped
    }
}

try {
    $repoRootPath = (Resolve-Path -LiteralPath $RepoRoot).Path

    if ($Apply) {
        Invoke-ApplyFixPlan -RepoRootPath $repoRootPath -PlanPath $FixPlanPath -IsDryRun:$DryRun | Out-Null
        exit 0
    }

    if (-not (Test-Path -LiteralPath $ScanReportPath)) {
        throw "Scan report not found: $ScanReportPath"
    }

    $scan = Get-Content -LiteralPath $ScanReportPath -Raw | ConvertFrom-Json
    if ($null -eq $scan -or $null -eq $scan.matches) {
        throw "Invalid scan report format: $ScanReportPath"
    }

    $bucketA = @($scan.matches | Where-Object {
        $_.classification -eq 'MISSING_WEBP' -and -not [bool]$_.pngExistsAtResolvedPath
    })

    $fileFreq = @{}
    foreach ($m in $bucketA) {
        $f = [string]$m.file
        if (-not $fileFreq.ContainsKey($f)) { $fileFreq[$f] = 0 }
        $fileFreq[$f]++
    }

    $literalFreq = @{}
    $literalFileMax = @{}
    foreach ($m in $bucketA) {
        $lit = [string]$m.originalLiteral
        $f = [string]$m.file
        if (-not $literalFreq.ContainsKey($lit)) { $literalFreq[$lit] = 0 }
        $literalFreq[$lit]++

        $k = "$lit|$f"
        if (-not $literalFileMax.ContainsKey($k)) { $literalFileMax[$k] = 0 }
        $literalFileMax[$k]++
    }

    $bucketASorted = $bucketA | Sort-Object `
        @{ Expression = { -1 * $literalFreq[[string]$_.originalLiteral] } }, `
        @{ Expression = { -1 * $literalFileMax[([string]$_.originalLiteral + '|' + [string]$_.file)] } }, `
        @{ Expression = { [string]$_.file } }, `
        @{ Expression = { [int]$_.line } }

    $takeItems = @($bucketASorted | Select-Object -First $Take)

    $traceRows = New-Object System.Collections.Generic.List[object]
    $fixRows = New-Object System.Collections.Generic.List[object]
    $styleCounts = @{}

    foreach ($m in $takeItems) {
        $fileRel = [string]$m.file
        $fileAbs = Join-Path $repoRootPath ($fileRel -replace '/', [System.IO.Path]::DirectorySeparatorChar)
        $lineNum = [int]$m.line

        $ctx = Get-ContextLines -FileAbs $fileAbs -Line $lineNum -Radius 3
        $lineText = ''
        $lineMatch = $ctx | Where-Object { [int]$_.line -eq $lineNum } | Select-Object -First 1
        if ($null -ne $lineMatch) { $lineText = [string]$lineMatch.text }

        $style = Get-RefStyle -Literal ([string]$m.originalLiteral) -LineText $lineText
        if (-not $styleCounts.ContainsKey($style)) { $styleCounts[$style] = 0 }
        $styleCounts[$style]++

        $traceRows.Add([ordered]@{
            file = $fileRel
            line = $lineNum
            column = [int]$m.column
            originalLiteral = [string]$m.originalLiteral
            refStyle = $style
            context = @($ctx)
            pngResolvedPath = $m.pngResolvedPath
            pngResolutionMethod = $m.pngResolutionMethod
            movedOrPathMismatchCandidate = [bool]$m.movedOrPathMismatchCandidate
            remediationHint = $m.remediationHint
        }) | Out-Null

    }

    foreach ($m in $bucketA) {
        $fileRel = [string]$m.file
        $fileAbs = Join-Path $repoRootPath ($fileRel -replace '/', [System.IO.Path]::DirectorySeparatorChar)
        if (-not (Test-Path -LiteralPath $fileAbs)) { continue }

        $lineNum = [int]$m.line
        $lineText = ''
        try {
            $lines = Get-Content -LiteralPath $fileAbs
            if ($lineNum -gt 0 -and $lineNum -le $lines.Count) {
                $lineText = [string]$lines[$lineNum - 1]
            }
        }
        catch { }

        $withLineText = [pscustomobject]@{
            originalLiteral = [string]$m.originalLiteral
            lineText = $lineText
        }
        $det = Resolve-DeterministicReplacement -Match $withLineText -FileAbs $fileAbs -RepoRootPath $repoRootPath
        if ($null -ne $det) {
            $fixRows.Add([ordered]@{
                file = $fileRel
                line = $lineNum
                spanStart = [int]$m.spanStart
                spanLength = [int]$m.spanLength
                originalLiteral = [string]$m.originalLiteral
                replacementLiteral = [string]$det.replacementLiteral
                reason = [string]$det.reason
                evidencePath = [string]$det.evidencePath
            }) | Out-Null
        }
    }

    $traceDoc = [ordered]@{
        generatedAt = (Get-Date).ToString('o')
        repoRoot = $repoRootPath
        sourceScan = $ScanReportPath
        take = $Take
        bucketASelected = $traceRows.Count
        styleCounts = $styleCounts
        entries = @($traceRows.ToArray())
    }

    $fixDoc = [ordered]@{
        generatedAt = (Get-Date).ToString('o')
        repoRoot = $repoRootPath
        sourceScan = $ScanReportPath
        strategy = @('S1_MODULE_RELATIVE_EXTENSION_MATCH', 'S2_PUBLIC_URL_EXTENSION_MATCH')
        fixes = @($fixRows.ToArray())
    }

    $traceDir = Split-Path -Parent $OutPath
    if (-not (Test-Path -LiteralPath $traceDir)) {
        New-Item -ItemType Directory -Path $traceDir -Force | Out-Null
    }

    $fixDir = Split-Path -Parent $FixPlanPath
    if (-not (Test-Path -LiteralPath $fixDir)) {
        New-Item -ItemType Directory -Path $fixDir -Force | Out-Null
    }

    $traceDoc | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $OutPath -Encoding UTF8
    $fixDoc | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $FixPlanPath -Encoding UTF8

    Write-Host "bucket A total: $($bucketA.Count)"
    Write-Host "trace shortlist: $($traceRows.Count) -> $OutPath"
    Write-Host "deterministic fix plan count: $($fixRows.Count) -> $FixPlanPath"

    if ($traceRows.Count -gt 0) {
        $sample = $traceRows[0]
        Write-Host "sample: $($sample.file):$($sample.line) :: $($sample.originalLiteral)"
    }

    exit 0
}
catch {
    Write-Error $_
    exit 1
}
