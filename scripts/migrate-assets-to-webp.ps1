#Requires -Version 5.1
<#
.SYNOPSIS
    Batch-convert .png/.jpg/.jpeg assets to .webp, archive originals, and rewrite
    static repo references to the new .webp paths.

.DESCRIPTION
    Default mode is PROBE-ONLY: no files are modified or moved.
    Pass -Execute to apply all changes.

    Phases (probe and execute):
      1. Scan $RootDir recursively for .png / .jpg / .jpeg
      2. Convert each to a sibling .webp (cwebp; PNG=lossless, JPG/JPEG=quality 85)
      3. Move originals to $ArchiveRoot preserving relative structure from $RootDir
      4. Rewrite static asset references in src/ and public/ to use .webp
      5. Print summary

    STOP conditions (execute mode):
      - cwebp not found
      - Archive collision (destination file already exists)
      - Dynamic reference patterns that cannot be safely rewritten are reported but do
        NOT stop execution; they are listed in the summary.

.PARAMETER RootDir
    Directory to scan. Recurses into all subdirectories.

.PARAMETER Execute
    Apply all changes. Without this switch the script runs in probe-only mode.

.PARAMETER Force
    Re-convert even if a current (newer or equal) .webp sibling already exists.

.PARAMETER ArchiveRoot
    Destination root for archived originals.
    Default: D:\Unity Apps\assets\immanence

.PARAMETER CwebpPath
    Explicit path to the cwebp binary. Auto-detected from PATH if omitted.

.PARAMETER RepoRoot
    Repo root for code-reference scanning. Auto-detected (walks up from $RootDir
    looking for package.json or .git) if omitted.

.EXAMPLE
    # Probe only – show what would change
    pwsh -File scripts/migrate-assets-to-webp.ps1 -RootDir src/assets

.EXAMPLE
    # Apply
    pwsh -File scripts/migrate-assets-to-webp.ps1 -RootDir src/assets -Execute

.EXAMPLE
    # Apply with forced re-conversion
    pwsh -File scripts/migrate-assets-to-webp.ps1 -RootDir public -Execute -Force
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [string]$RootDir,

    [switch]$Execute,
    [switch]$Force,

    [string]$ArchiveRoot = 'D:\Unity Apps\assets\immanence',

    [string]$CwebpPath,

    [string]$RepoRoot
)

$ErrorActionPreference = 'Stop'
$PSNativeCommandUseErrorActionPreference = $false

$isProbe   = -not $Execute.IsPresent
$modeLabel = if ($isProbe) { 'PROBE' } else { 'EXECUTE' }

Write-Host ''
Write-Host "=== migrate-assets-to-webp  mode=$modeLabel ==="
Write-Host ''

# ---------------------------------------------------------------------------
# Helper functions
# ---------------------------------------------------------------------------

function Resolve-CwebpExe {
    param([string]$RequestedPath)
    if (-not [string]::IsNullOrWhiteSpace($RequestedPath)) {
        if (Test-Path -LiteralPath $RequestedPath) {
            return (Resolve-Path -LiteralPath $RequestedPath).Path
        }
        throw "cwebp binary not found at specified path: $RequestedPath"
    }
    $found = Get-Command cwebp -ErrorAction SilentlyContinue
    if ($null -ne $found) { return $found.Source }
    throw (
        'cwebp not found on PATH. ' +
        'Install WebP tools (https://developers.google.com/speed/webp/docs/precompiled) ' +
        'or pass -CwebpPath <path>.'
    )
}

function Resolve-RepoRoot {
    param([string]$StartDir)
    $current = [System.IO.Path]::GetFullPath($StartDir)
    while ($true) {
        if ((Test-Path (Join-Path $current 'package.json')) -or
            (Test-Path (Join-Path $current '.git'))) {
            return $current
        }
        $parent = [System.IO.Path]::GetDirectoryName($current)
        if ([string]::IsNullOrEmpty($parent) -or $parent -eq $current) {
            throw "Cannot locate repo root (no package.json or .git) walking up from: $StartDir"
        }
        $current = $parent
    }
}

function Get-ArchiveDest {
    param([string]$FilePath, [string]$ScanRoot, [string]$ArchiveDest)
    $scanRootFull = [System.IO.Path]::GetFullPath($ScanRoot).TrimEnd('\', '/')
    $fileFull     = [System.IO.Path]::GetFullPath($FilePath)
    if (-not $fileFull.StartsWith($scanRootFull, [System.StringComparison]::OrdinalIgnoreCase)) {
        throw "File '$FilePath' is not under scan root '$ScanRoot'"
    }
    $rel = $fileFull.Substring($scanRootFull.Length).TrimStart('\', '/')
    return Join-Path $ArchiveDest $rel
}

function Should-Convert {
    param([System.IO.FileInfo]$File, [string]$WebpPath, [bool]$ForceFlag)
    if ($ForceFlag) { return $true }
    if (-not (Test-Path -LiteralPath $WebpPath)) { return $true }
    $existing = Get-Item -LiteralPath $WebpPath
    return ($existing.LastWriteTimeUtc -lt $File.LastWriteTimeUtc -or $existing.Length -eq 0)
}

function Get-CwebpArgs {
    param([System.IO.FileInfo]$File, [string]$OutputPath)
    if ($File.Extension -ieq '.png') {
        return @('-lossless', '-m', '6', '--', $File.FullName, '-o', $OutputPath)
    }
    # .jpg / .jpeg
    return @('-q', '85', '-m', '6', '--', $File.FullName, '-o', $OutputPath)
}

# ---------------------------------------------------------------------------
# Setup
# ---------------------------------------------------------------------------

$rootDirFull = (Resolve-Path -LiteralPath $RootDir).Path

if ([string]::IsNullOrWhiteSpace($RepoRoot)) {
    $RepoRoot = Resolve-RepoRoot -StartDir $rootDirFull
}
$repoRootFull    = [System.IO.Path]::GetFullPath($RepoRoot)
$archiveRootFull = [System.IO.Path]::GetFullPath($ArchiveRoot)

Write-Host "Repo root    : $repoRootFull"
Write-Host "Scan root    : $rootDirFull"
Write-Host "Archive root : $archiveRootFull"

$cwebpExe = Resolve-CwebpExe -RequestedPath $CwebpPath
Write-Host "cwebp        : $cwebpExe"
Write-Host ''

# ---------------------------------------------------------------------------
# Phase 1 – Scan images
# ---------------------------------------------------------------------------

$allImages = @(
    Get-ChildItem -LiteralPath $rootDirFull -Recurse -File |
        Where-Object { $_.Extension -match '^\.(?i)(png|jpe?g)$' }
)

$toConvert = [System.Collections.Generic.List[System.IO.FileInfo]]::new()
$toSkip    = [System.Collections.Generic.List[System.IO.FileInfo]]::new()

foreach ($img in $allImages) {
    $webpPath = [System.IO.Path]::ChangeExtension($img.FullName, '.webp')
    if (Should-Convert -File $img -WebpPath $webpPath -ForceFlag $Force.IsPresent) {
        $toConvert.Add($img)
    }
    else {
        $toSkip.Add($img)
    }
}

Write-Host "Images found         : $($allImages.Count)"
Write-Host "Will convert         : $($toConvert.Count)"
Write-Host "Skip (webp current)  : $($toSkip.Count)"
Write-Host ''

# ---------------------------------------------------------------------------
# Phase 2 – Convert + archive (probe or execute)
# ---------------------------------------------------------------------------

$convertedFiles = [System.Collections.Generic.List[System.IO.FileInfo]]::new()
$failedFiles    = [System.Collections.Generic.List[object]]::new()

foreach ($img in $toConvert) {
    $webpPath    = [System.IO.Path]::ChangeExtension($img.FullName, '.webp')
    $archiveDest = Get-ArchiveDest -FilePath $img.FullName -ScanRoot $rootDirFull -ArchiveDest $archiveRootFull

    if ($isProbe) {
        Write-Host "PROBE CONVERT  : $($img.FullName)"
        Write-Host "             => $webpPath"
        Write-Host "  PROBE ARCHIVE: $($img.FullName)"
        Write-Host "             => $archiveDest"
        $convertedFiles.Add($img)
        continue
    }

    # ---- execute mode ----

    # Check archive collision before doing any work for this file.
    if (Test-Path -LiteralPath $archiveDest) {
        Write-Error (
            "ARCHIVE COLLISION: destination already exists.`n" +
            "  Source  : $($img.FullName)`n" +
            "  Archive : $archiveDest`n" +
            "Resolve the collision manually, then re-run."
        )
        exit 1
    }

    # Convert
    $convArgs = Get-CwebpArgs -File $img -OutputPath $webpPath
    & $cwebpExe @convArgs 2>&1 | Out-Null
    $exitCode = $LASTEXITCODE

    $webpOk = (
        $exitCode -eq 0 -and
        (Test-Path -LiteralPath $webpPath) -and
        (Get-Item -LiteralPath $webpPath).Length -gt 0
    )

    if (-not $webpOk) {
        Write-Warning "FAILED (cwebp exit=$exitCode): $($img.FullName)"
        $failedFiles.Add([pscustomobject]@{
            path   = $img.FullName
            reason = "cwebp exit code $exitCode"
        })
        # Clean up empty/corrupt output if cwebp created one
        if ((Test-Path -LiteralPath $webpPath) -and (Get-Item -LiteralPath $webpPath).Length -eq 0) {
            Remove-Item -LiteralPath $webpPath -Force
        }
        continue
    }

    Write-Host "CONVERTED   : $($img.FullName)"

    # Archive original
    $archiveDir = Split-Path -Parent $archiveDest
    if (-not (Test-Path -LiteralPath $archiveDir)) {
        New-Item -ItemType Directory -Path $archiveDir -Force | Out-Null
    }
    Move-Item -LiteralPath $img.FullName -Destination $archiveDest
    Write-Host "  ARCHIVED  : $archiveDest"

    $convertedFiles.Add($img)
}

if ($toConvert.Count -gt 0) { Write-Host '' }

# ---------------------------------------------------------------------------
# Phase 3 – Build reference-rewrite map
# ---------------------------------------------------------------------------
# Only rewrite refs to files we converted in this run.
# Key: lowercase basename of original file (e.g. "hero.png")
# Value: metadata for replacement

$basenameMap      = @{}   # basename.lower -> pscustomobject
$ambiguousWarnings = [System.Collections.Generic.List[string]]::new()

foreach ($f in $convertedFiles) {
    $baseLower = $f.Name.ToLowerInvariant()
    if ($basenameMap.ContainsKey($baseLower)) {
        # Two converted files with the same name – cannot auto-rewrite safely.
        if (-not $ambiguousWarnings.Contains($baseLower)) {
            $ambiguousWarnings.Add($baseLower)
        }
    }
    else {
        $basenameMap[$baseLower] = [pscustomobject]@{
            oldName    = $f.Name
            newName    = [System.IO.Path]::ChangeExtension($f.Name, '.webp')
            sourcePath = $f.FullName
        }
    }
}

# Remove ambiguous basenames from the rewrite map
foreach ($ambig in $ambiguousWarnings) {
    $basenameMap.Remove($ambig)
    Write-Warning "AMBIGUOUS BASENAME - skipping auto-rewrite for: $ambig (multiple converted files share this name)"
}

# ---------------------------------------------------------------------------
# Phase 4 – Scan code files and collect rewrites
# ---------------------------------------------------------------------------

$codeExtensions = @('.js', '.jsx', '.ts', '.tsx', '.css', '.scss', '.html', '.json', '.md', '.glsl')
$codeScanDirs   = @(
    (Join-Path $repoRootFull 'src'),
    (Join-Path $repoRootFull 'public')
)

$codeFiles = [System.Collections.Generic.List[System.IO.FileInfo]]::new()
foreach ($dir in $codeScanDirs) {
    if (-not (Test-Path -LiteralPath $dir)) { continue }
    $found = Get-ChildItem -LiteralPath $dir -Recurse -File | Where-Object {
        $codeExtensions -contains $_.Extension.ToLowerInvariant() -and
        $_.FullName -notmatch '[\\/](?:node_modules|dist|\.git)[\\/]'
    }
    foreach ($cf in $found) { $codeFiles.Add($cf) }
}

# Regex: match static path tokens ending in .png / .jpg / .jpeg
# Captures path (without leading quote) and optional ?query#hash tail.
# Single-quotes in the character class are doubled to escape in PowerShell here-string.
$imgPattern = [System.Text.RegularExpressions.Regex]::new(
    '(?i)(?<path>[^\s"''`\r\n<>\(\)\[\]{}][^"''`\r\n<>\(\)\[\]{}]*?\.(?:png|jpe?g))' +
    '(?<tail>(?:\?[^"''`\s<>\)\[\]{}]*)?(?:#[^"''`\s<>\)\[\]{}]*)?)',
    [System.Text.RegularExpressions.RegexOptions]::IgnoreCase
)

$dynamicRefs  = [System.Collections.Generic.List[object]]::new()
$rewritesByFile = @{}   # absPath -> List[pscustomobject]
$totalRefsFound = 0

foreach ($cf in $codeFiles) {
    $content = Get-Content -LiteralPath $cf.FullName -Raw
    if ([string]::IsNullOrEmpty($content)) { continue }

    $matches = $imgPattern.Matches($content)
    if ($matches.Count -eq 0) { continue }

    foreach ($m in $matches) {
        $pathPart = $m.Groups['path'].Value
        $tailPart = $m.Groups['tail'].Value

        # Skip absolute URLs and data URIs
        if ($pathPart -match '^(?i)(https?:|data:|ftp:)') { continue }

        # Flag dynamic template expressions
        if ($pathPart -match '\$\{') {
            # Compute line number for reporting
            $lineNum = ($content.Substring(0, $m.Index) -split '\r?\n').Count
            $dynamicRefs.Add([pscustomobject]@{
                file    = $cf.FullName
                lineNum = $lineNum
                match   = $m.Value
            })
            continue
        }

        # Get the basename of the referenced file
        $refBaseLower = [System.IO.Path]::GetFileName($pathPart).ToLowerInvariant()

        # Only rewrite if this basename maps to a converted file
        if (-not $basenameMap.ContainsKey($refBaseLower)) { continue }

        $totalRefsFound++

        # Build replacement: change extension only, keep the full path prefix intact
        $newPath    = [System.Text.RegularExpressions.Regex]::Replace($pathPart, '(?i)\.(?:png|jpe?g)$', '.webp')
        $replacement = $newPath + $tailPart

        $lineNum = ($content.Substring(0, $m.Index) -split '\r?\n').Count

        if (-not $rewritesByFile.ContainsKey($cf.FullName)) {
            $rewritesByFile[$cf.FullName] = [System.Collections.Generic.List[object]]::new()
        }
        $rewritesByFile[$cf.FullName].Add([pscustomobject]@{
            spanStart   = $m.Index
            spanLength  = $m.Length
            original    = $m.Value
            replacement = $replacement
            lineNum     = $lineNum
        })
    }
}

# ---------------------------------------------------------------------------
# Phase 5 – Apply or report rewrites
# ---------------------------------------------------------------------------

if ($dynamicRefs.Count -gt 0) {
    Write-Host '--- DYNAMIC REFERENCES (not rewritten; manual review required) ---'
    foreach ($d in $dynamicRefs) {
        $rel = $d.file.Substring($repoRootFull.Length).TrimStart('\', '/')
        Write-Host "  DYNAMIC: $rel :$($d.lineNum)  >>  $($d.match)"
    }
    Write-Host ''
}

$utf8NoBom      = [System.Text.UTF8Encoding]::new($false)
$filesRewritten = 0
$refsRewritten  = 0

foreach ($filePath in $rewritesByFile.Keys) {
    $entries = @($rewritesByFile[$filePath] | Sort-Object { [int]$_.spanStart } -Descending)
    $relPath = $filePath.Substring($repoRootFull.Length).TrimStart('\', '/')

    if ($isProbe) {
        foreach ($e in ($entries | Sort-Object { [int]$_.spanStart })) {
            Write-Host "PROBE REWRITE  : $relPath :$($e.lineNum)"
            Write-Host "             $($e.original)  =>  $($e.replacement)"
        }
        $filesRewritten++
        $refsRewritten += $entries.Count
        continue
    }

    # Execute: apply replacements working from end of file backwards
    $content = Get-Content -LiteralPath $filePath -Raw
    $changed = $false

    foreach ($e in $entries) {
        $start = [int]$e.spanStart
        $len   = [int]$e.spanLength
        if ($start -lt 0 -or $len -lt 0 -or ($start + $len) -gt $content.Length) {
            Write-Warning "SKIPPED (span out of range): $relPath"
            continue
        }
        $slice = $content.Substring($start, $len)
        if ($slice -cne $e.original) {
            Write-Warning "SKIPPED (content mismatch at :$($e.lineNum)): $relPath"
            continue
        }
        $content = $content.Substring(0, $start) + $e.replacement + $content.Substring($start + $len)
        $changed = $true
        $refsRewritten++
    }

    if ($changed) {
        [System.IO.File]::WriteAllText($filePath, $content, $utf8NoBom)
        Write-Host "UPDATED: $relPath  ($($entries.Count) refs)"
        $filesRewritten++
    }
}

if ($rewritesByFile.Count -gt 0) { Write-Host '' }

# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------

Write-Host '=== SUMMARY ==='
Write-Host "Mode                       : $modeLabel"
Write-Host "Images scanned             : $($allImages.Count)"
Write-Host "Converted                  : $($convertedFiles.Count)"
Write-Host "Archived (originals moved) : $(if ($isProbe) { "$($convertedFiles.Count) (probe)" } else { $convertedFiles.Count })"
Write-Host "Skipped (.webp up-to-date) : $($toSkip.Count)"
Write-Host "Failed                     : $($failedFiles.Count)"
Write-Host "Refs found in code         : $totalRefsFound"
Write-Host "Refs rewritten             : $refsRewritten  (in $filesRewritten files)"
Write-Host "Dynamic refs (not rewritten): $($dynamicRefs.Count)"

if ($ambiguousWarnings.Count -gt 0) {
    Write-Host "Ambiguous basenames skipped: $($ambiguousWarnings.Count)"
}

if ($failedFiles.Count -gt 0) {
    Write-Host ''
    Write-Host '--- FAILED FILES ---'
    foreach ($f in $failedFiles) { Write-Host "  $($f.path)  ($($f.reason))" }
}

if ($isProbe) {
    Write-Host ''
    Write-Host '==> PROBE COMPLETE. Re-run with -Execute to apply all changes above.'
}

if ($failedFiles.Count -gt 0) { exit 1 }
exit 0
