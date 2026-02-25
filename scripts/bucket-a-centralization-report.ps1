[CmdletBinding()]
param(
    [string]$ScanPath,
    [string]$JsonOutPath,
    [string]$CsvOutPath
)

$ErrorActionPreference = 'Stop'
$scriptDirectory = Split-Path -Parent $PSCommandPath

if ([string]::IsNullOrWhiteSpace($ScanPath)) {
    $ScanPath = Join-Path $scriptDirectory '.tmp\asset-ref-scan.json'
}
if ([string]::IsNullOrWhiteSpace($JsonOutPath)) {
    $JsonOutPath = Join-Path $scriptDirectory '.tmp\bucket-a-centralization.json'
}
if ([string]::IsNullOrWhiteSpace($CsvOutPath)) {
    $CsvOutPath = Join-Path $scriptDirectory '.tmp\bucket-a-centralization.csv'
}

function Get-StringOrNull {
    param([object]$Value)
    if ($null -eq $Value) { return $null }
    $s = [string]$Value
    if ([string]::IsNullOrWhiteSpace($s)) { return $null }
    return $s
}

try {
    if (-not (Test-Path -LiteralPath $ScanPath)) {
        throw "Input scan file not found: $ScanPath"
    }

    $scan = Get-Content -LiteralPath $ScanPath -Raw | ConvertFrom-Json
    if ($null -eq $scan -or $null -eq $scan.matches) {
        throw "Invalid scan report format: $ScanPath"
    }

    $bucketA = @($scan.matches | Where-Object {
        $_.classification -eq 'MISSING_WEBP' -and -not [bool]$_.pngExistsAtResolvedPath
    })

    $totalBucketA = $bucketA.Count
    if ($totalBucketA -ne 156) {
        Write-Host '=== BUCKET A CENTRALIZATION REPORT ==='
        Write-Host "TOTAL_BUCKET_A: $totalBucketA"
        Write-Error 'FAIL: TOTAL_BUCKET_A != 156'
        exit 1
    }

    $distinctFiles = @($bucketA | Select-Object -ExpandProperty file -Unique).Count
    $distinctLiterals = @($bucketA | Select-Object -ExpandProperty originalLiteral -Unique).Count

    $topFiles = @(
        $bucketA |
        Group-Object -Property file |
        Sort-Object -Property @{ Expression = 'Count'; Descending = $true }, @{ Expression = 'Name'; Descending = $false } |
        Select-Object -First 20 |
        ForEach-Object {
            [ordered]@{
                filePath = [string]$_.Name
                missingCount = [int]$_.Count
            }
        }
    )

    $topLiterals = @(
        $bucketA |
        Group-Object -Property originalLiteral |
        Sort-Object -Property @{ Expression = 'Count'; Descending = $true }, @{ Expression = 'Name'; Descending = $false } |
        Select-Object -First 20 |
        ForEach-Object {
            [ordered]@{
                literalString = [string]$_.Name
                occurrenceCount = [int]$_.Count
            }
        }
    )

    $styleBuckets = [ordered]@{
        PUBLIC_URL_ABSOLUTE = 0
        PUBLIC_URL_RELATIVE = 0
        MODULE_RELATIVE = 0
        TEMPLATE = 0
        CSS_URL = 0
        OTHER = 0
    }

    foreach ($m in $bucketA) {
        $style = Get-StringOrNull -Value $m.refStyle
        if ($null -ne $style -and $styleBuckets.Contains($style)) {
            $styleBuckets[$style] = [int]$styleBuckets[$style] + 1
        }
        else {
            $styleBuckets.OTHER = [int]$styleBuckets.OTHER + 1
        }
    }

    $report = [ordered]@{
        generatedAt = (Get-Date).ToString('o')
        scanPath = $ScanPath
        totalBucketA = $totalBucketA
        distinctFiles = $distinctFiles
        distinctLiterals = $distinctLiterals
        topFiles = $topFiles
        topLiterals = $topLiterals
        refStyleDistribution = $styleBuckets
    }

    $jsonDir = Split-Path -Parent $JsonOutPath
    if (-not (Test-Path -LiteralPath $jsonDir)) {
        New-Item -ItemType Directory -Path $jsonDir -Force | Out-Null
    }

    $csvDir = Split-Path -Parent $CsvOutPath
    if (-not (Test-Path -LiteralPath $csvDir)) {
        New-Item -ItemType Directory -Path $csvDir -Force | Out-Null
    }

    $report | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $JsonOutPath -Encoding UTF8

    $csvRows = New-Object System.Collections.Generic.List[object]
    foreach ($row in $topFiles) {
        $csvRows.Add([pscustomobject]@{
            section = 'TOP_FILES'
            key = $row.filePath
            count = $row.missingCount
        }) | Out-Null
    }
    foreach ($row in $topLiterals) {
        $csvRows.Add([pscustomobject]@{
            section = 'TOP_LITERALS'
            key = $row.literalString
            count = $row.occurrenceCount
        }) | Out-Null
    }
    foreach ($k in $styleBuckets.Keys) {
        $csvRows.Add([pscustomobject]@{
            section = 'REF_STYLE_DISTRIBUTION'
            key = [string]$k
            count = [int]$styleBuckets[$k]
        }) | Out-Null
    }
    $csvRows | Export-Csv -LiteralPath $CsvOutPath -NoTypeInformation -Encoding UTF8

    Write-Host '=== BUCKET A CENTRALIZATION REPORT ==='
    Write-Host "TOTAL_BUCKET_A: $totalBucketA"
    Write-Host "DISTINCT_FILES: $distinctFiles"
    Write-Host "DISTINCT_LITERALS: $distinctLiterals"
    Write-Host ''
    Write-Host 'TOP_FILES:'
    $i = 1
    foreach ($row in $topFiles) {
        Write-Host ("{0}. {1} - {2}" -f $i, $row.filePath, $row.missingCount)
        $i++
    }
    Write-Host ''
    Write-Host 'TOP_LITERALS:'
    $i = 1
    foreach ($row in $topLiterals) {
        Write-Host ("{0}. {1} - {2}" -f $i, $row.literalString, $row.occurrenceCount)
        $i++
    }
    Write-Host ''
    Write-Host 'REF_STYLE_DISTRIBUTION:'
    Write-Host "PUBLIC_URL_ABSOLUTE: $($styleBuckets.PUBLIC_URL_ABSOLUTE)"
    Write-Host "PUBLIC_URL_RELATIVE: $($styleBuckets.PUBLIC_URL_RELATIVE)"
    Write-Host "MODULE_RELATIVE: $($styleBuckets.MODULE_RELATIVE)"
    Write-Host "TEMPLATE: $($styleBuckets.TEMPLATE)"
    Write-Host "CSS_URL: $($styleBuckets.CSS_URL)"
    Write-Host "OTHER: $($styleBuckets.OTHER)"
    Write-Host ''
    Write-Host 'REPORT_WRITTEN:'
    Write-Host 'scripts/.tmp/bucket-a-centralization.json'
    Write-Host 'scripts/.tmp/bucket-a-centralization.csv'

    exit 0
}
catch {
    Write-Error $_
    exit 1
}
