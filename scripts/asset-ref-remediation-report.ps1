[CmdletBinding()]
param(
    [string]$ScanReportPath,
    [string]$OutCsvPath,
    [string]$OutJsonPath
)

$ErrorActionPreference = 'Stop'
$scriptDirectory = Split-Path -Parent $PSCommandPath

if ([string]::IsNullOrWhiteSpace($ScanReportPath)) {
    $ScanReportPath = Join-Path $scriptDirectory '.tmp\asset-ref-scan.json'
}
if ([string]::IsNullOrWhiteSpace($OutCsvPath)) {
    $OutCsvPath = Join-Path $scriptDirectory '.tmp\asset-remediation.csv'
}
if ([string]::IsNullOrWhiteSpace($OutJsonPath)) {
    $OutJsonPath = Join-Path $scriptDirectory '.tmp\asset-remediation.json'
}

function Join-Candidates {
    param([object[]]$Candidates)
    if ($null -eq $Candidates -or $Candidates.Count -eq 0) {
        return ''
    }
    return (($Candidates | ForEach-Object { [string]$_ }) -join ' | ')
}

try {
    if (-not (Test-Path -LiteralPath $ScanReportPath)) {
        throw "Scan report not found: $ScanReportPath"
    }

    $scan = Get-Content -LiteralPath $ScanReportPath -Raw | ConvertFrom-Json
    $matches = @($scan.matches)

    $bucketA = @($matches | Where-Object {
        $_.classification -eq 'MISSING_WEBP' -and -not [bool]$_.pngExistsAtResolvedPath
    })
    $bucketB = @($matches | Where-Object {
        $_.classification -eq 'MISSING_WEBP' -and [bool]$_.pngExistsAtResolvedPath
    })
    $bucketC = @($matches | Where-Object {
        [bool]$_.movedOrPathMismatchCandidate
    })
    $bucketD = @($matches | Where-Object {
        $_.classification -eq 'AMBIGUOUS'
    })
    $bucketE = @($matches | Where-Object {
        $_.classification -eq 'NON_PATH'
    })

    $topAByFile = $bucketA | Group-Object file | Sort-Object Count -Descending | Select-Object -First 20 | ForEach-Object {
        [ordered]@{ file = $_.Name; count = $_.Count }
    }

    $missingWebpSiblingSet = New-Object System.Collections.Generic.HashSet[string]([System.StringComparer]::OrdinalIgnoreCase)
    foreach ($m in $bucketB) {
        if ($null -ne $m.pngResolvedPath -and -not [string]::IsNullOrWhiteSpace($m.pngResolvedPath.relative)) {
            $missingWebpSiblingSet.Add([string]$m.pngResolvedPath.relative) | Out-Null
        }
    }

    $rows = New-Object System.Collections.Generic.List[object]
    foreach ($m in $matches) {
        $issue = switch ($m.classification) {
            'NON_PATH' { 'NON_PATH' ; break }
            'AMBIGUOUS' { 'AMBIGUOUS_BASENAME_OR_DYNAMIC' ; break }
            'MISSING_WEBP' {
                if ([bool]$m.movedOrPathMismatchCandidate) { 'UNIQUE_WEBP_ELSEWHERE_UNSAFE' }
                elseif ([bool]$m.pngExistsAtResolvedPath) { 'PNG_EXISTS_WEBP_MISSING_AT_PATH' }
                else { 'REF_POINTS_TO_NON_EXISTENT_PNG' }
                break
            }
            default { 'OTHER' }
        }

        $resolvedPath = if ($null -ne $m.pngResolvedPath) { [string]$m.pngResolvedPath.relative } else { '' }
        $row = [ordered]@{
            file = [string]$m.file
            line = [int]$m.line
            ref = [string]$m.matchedText
            issue = $issue
            resolvedPath = $resolvedPath
            webpCandidates = Join-Candidates -Candidates @($m.candidateWebpPaths)
        }
        $rows.Add($row) | Out-Null
    }

    $outDir = Split-Path -Parent $OutCsvPath
    if (-not (Test-Path -LiteralPath $outDir)) {
        New-Item -ItemType Directory -Path $outDir -Force | Out-Null
    }

    @($rows.ToArray()) | Export-Csv -LiteralPath $OutCsvPath -NoTypeInformation -Encoding UTF8

    $report = [ordered]@{
        generatedAt = (Get-Date).ToString('o')
        sourceScanReport = $ScanReportPath
        totals = [ordered]@{
            matches = $matches.Count
            bucketA_refPointsToNonExistentPng = $bucketA.Count
            bucketB_pngExistsButWebpMissingAtPath = $bucketB.Count
            bucketC_uniqueWebpElsewhereUnsafe = $bucketC.Count
            bucketD_ambiguous = $bucketD.Count
            bucketE_nonPath = $bucketE.Count
        }
        bucketA = [ordered]@{
            topFiles = @($topAByFile)
            examples = @($bucketA | Select-Object -First 15 | ForEach-Object {
                [ordered]@{
                    file = $_.file
                    line = $_.line
                    ref = $_.matchedText
                    resolvedPath = if ($null -ne $_.pngResolvedPath) { $_.pngResolvedPath.relative } else { $null }
                }
            })
        }
        bucketB = [ordered]@{
            count = $bucketB.Count
            pngFilesMissingWebpSibling = @($missingWebpSiblingSet)
        }
        bucketC = [ordered]@{
            count = $bucketC.Count
            items = @($bucketC | Select-Object -First 50 | ForEach-Object {
                [ordered]@{
                    file = $_.file
                    line = $_.line
                    ref = $_.matchedText
                    resolvedPath = if ($null -ne $_.pngResolvedPath) { $_.pngResolvedPath.relative } else { $null }
                    uniqueWebpCandidate = if ($null -ne $_.candidateWebpPaths -and $_.candidateWebpPaths.Count -gt 0) { $_.candidateWebpPaths[0] } else { $null }
                    confidence = 'UNSAFE'
                }
            })
        }
        bucketD = [ordered]@{
            count = $bucketD.Count
            items = @($bucketD | Select-Object -First 50 | ForEach-Object {
                [ordered]@{
                    file = $_.file
                    line = $_.line
                    ref = $_.matchedText
                    candidates = @($_.candidateWebpPaths)
                }
            })
        }
        bucketE = [ordered]@{
            count = $bucketE.Count
            items = @($bucketE | Select-Object -First 50 | ForEach-Object {
                [ordered]@{
                    file = $_.file
                    line = $_.line
                    ref = $_.matchedText
                }
            })
        }
        nextActions = @(
            'If bucket B is large: rerun conversion for PNGs that exist but lack WebP siblings, then rescan.',
            'If bucket A is large: references are stale/wrong; fix refs or restore assets at the expected PNG paths.',
            'If bucket C dominates: assets likely moved; choose deterministic path alignment (move assets back) or curated explicit mapping table before apply.'
        )
        csvPath = $OutCsvPath
    }

    $report | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $OutJsonPath -Encoding UTF8

    Write-Host 'Remediation buckets:'
    Write-Host ("  A ref->missing PNG: " + $bucketA.Count)
    Write-Host ("  B PNG exists, WebP missing: " + $bucketB.Count)
    Write-Host ("  C unique WebP elsewhere (unsafe): " + $bucketC.Count)
    Write-Host ("  D ambiguous basename: " + $bucketD.Count)
    Write-Host ("  E non-path: " + $bucketE.Count)
    Write-Host ("CSV: " + $OutCsvPath)
    Write-Host ("JSON: " + $OutJsonPath)
    exit 0
}
catch {
    Write-Error $_
    exit 1
}
