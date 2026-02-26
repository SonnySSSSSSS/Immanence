[CmdletBinding()]
param(
    [string]$RepoRoot,
    [string]$PublicRoot,
    [string]$BackupRoot,
    [switch]$Apply,
    [switch]$DryRun,
    [string]$ReportJson,
    [string]$ReportCsv
)

$ErrorActionPreference = 'Stop'

if ([string]::IsNullOrWhiteSpace($RepoRoot)) {
    $RepoRoot = 'D:\Unity Apps\immanence-os'
}
if ([string]::IsNullOrWhiteSpace($PublicRoot)) {
    $PublicRoot = Join-Path $RepoRoot 'public'
}
if ([string]::IsNullOrWhiteSpace($BackupRoot)) {
    $BackupRoot = 'D:\Unity Apps\assets\immanence\_backup_assets'
}
if ([string]::IsNullOrWhiteSpace($ReportJson)) {
    $ReportJson = Join-Path $RepoRoot 'scripts\.tmp\png-backup-space-report.json'
}
if ([string]::IsNullOrWhiteSpace($ReportCsv)) {
    $ReportCsv = Join-Path $RepoRoot 'scripts\.tmp\png-backup-space-report.csv'
}

if (-not (Test-Path -LiteralPath $PublicRoot)) {
    throw "Public root not found: $PublicRoot"
}

$publicRootResolved = (Resolve-Path -LiteralPath $PublicRoot).Path
if (-not (Test-Path -LiteralPath $BackupRoot)) {
    if ($Apply) {
        New-Item -ItemType Directory -Path $BackupRoot -Force | Out-Null
    }
}

$pngFiles = Get-ChildItem -LiteralPath $publicRootResolved -Recurse -File -Filter *.png

$movedPairs = New-Object System.Collections.Generic.List[object]
$rainbowTouched = 0

foreach ($png in $pngFiles) {
    $full = $png.FullName
    $rel = $full.Substring($publicRootResolved.Length) -replace '^[\\/]+', '' -replace '\\','/'

    if ($rel.ToLowerInvariant().StartsWith('rainbow/')) {
        continue
    }

    $webpPath = [System.Text.RegularExpressions.Regex]::Replace($full, '(?i)\.png$', '.webp')
    if (-not (Test-Path -LiteralPath $webpPath)) {
        continue
    }

    $dst = Join-Path $BackupRoot ($rel -replace '/', [System.IO.Path]::DirectorySeparatorChar)

    $pngSize = (Get-Item -LiteralPath $full).Length
    $webpSize = (Get-Item -LiteralPath $webpPath).Length

    $movedPairs.Add([pscustomobject]@{
        relativePath = $rel
        sourcePng = $full
        matchingWebp = $webpPath
        backupPng = $dst
        pngBytes = [int64]$pngSize
        webpBytes = [int64]$webpSize
    }) | Out-Null
}

if ($Apply) {
    foreach ($row in $movedPairs) {
        $dstDir = Split-Path -Parent $row.backupPng
        if (-not (Test-Path -LiteralPath $dstDir)) {
            New-Item -ItemType Directory -Path $dstDir -Force | Out-Null
        }
        Move-Item -LiteralPath $row.sourcePng -Destination $row.backupPng -Force
    }
}

$pngBytesMovedSet = [int64](($movedPairs | Measure-Object -Property pngBytes -Sum).Sum)
$webpBytesMatchingSet = [int64](($movedPairs | Measure-Object -Property webpBytes -Sum).Sum)
$absoluteSavings = $pngBytesMovedSet - $webpBytesMatchingSet
$percentReduction = if ($pngBytesMovedSet -gt 0) { [Math]::Round((($absoluteSavings * 100.0) / $pngBytesMovedSet), 2) } else { 0.0 }

$residualPairs = 0
$remainingPng = Get-ChildItem -LiteralPath $publicRootResolved -Recurse -File -Filter *.png
foreach ($png in $remainingPng) {
    $rel = $png.FullName.Substring($publicRootResolved.Length) -replace '^[\\/]+', '' -replace '\\','/'
    if ($rel.ToLowerInvariant().StartsWith('rainbow/')) { continue }
    $webpPath = [System.Text.RegularExpressions.Regex]::Replace($png.FullName, '(?i)\.png$', '.webp')
    if (Test-Path -LiteralPath $webpPath) {
        $residualPairs++
    }
}

$report = [pscustomobject]@{
    generatedAt = (Get-Date).ToString('o')
    mode = if ($Apply) { 'apply' } else { 'dry-run' }
    movedPngFiles = $movedPairs.Count
    pngBytesMovedSet = $pngBytesMovedSet
    webpBytesMatchingSet = $webpBytesMatchingSet
    absoluteSavingsBytes = $absoluteSavings
    percentReduction = $percentReduction
    rainbowTouched = $rainbowTouched
    residualPngWithWebpSiblingOutsideRainbow = $residualPairs
}

$reportDir = Split-Path -Parent $ReportJson
if (-not (Test-Path -LiteralPath $reportDir)) {
    New-Item -ItemType Directory -Path $reportDir -Force | Out-Null
}
$report | ConvertTo-Json -Depth 6 | Set-Content -LiteralPath $ReportJson -Encoding UTF8

$rows = @($movedPairs | Select-Object relativePath,pngBytes,webpBytes,sourcePng,matchingWebp,backupPng)
$rows | Export-Csv -LiteralPath $ReportCsv -NoTypeInformation -Encoding UTF8

Write-Host "mode=$(if($Apply){'apply'}else{'dry-run'}) moved=$($movedPairs.Count) residualPairs=$residualPairs"
Write-Host "report_json=$ReportJson"
Write-Host "report_csv=$ReportCsv"

if ($Apply -and $residualPairs -ne 0) {
    throw "Verification failed: residual PNG+WebP sibling pairs remain outside rainbow: $residualPairs"
}

