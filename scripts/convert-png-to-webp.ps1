[CmdletBinding()]
param(
    [string]$PublicRoot,
    [ValidateRange(0, 100)]
    [int]$Quality = 85,
    [ValidateRange(0, 6)]
    [int]$Method = 6,
    [switch]$Lossless,
    [string]$CwebpPath,
    [switch]$WriteManifest,
    [string]$ManifestPath
)

$ErrorActionPreference = 'Stop'
$PSNativeCommandUseErrorActionPreference = $false
$scriptDirectory = Split-Path -Parent $PSCommandPath

if ([string]::IsNullOrWhiteSpace($PublicRoot)) {
    $PublicRoot = Join-Path $scriptDirectory '..\public'
}

if ([string]::IsNullOrWhiteSpace($ManifestPath)) {
    $ManifestPath = Join-Path $scriptDirectory '.tmp\webp-manifest.json'
}

function Resolve-CwebpExecutable {
    param([string]$RequestedPath)

    if (-not [string]::IsNullOrWhiteSpace($RequestedPath)) {
        if (Test-Path -LiteralPath $RequestedPath) {
            return (Resolve-Path -LiteralPath $RequestedPath).Path
        }
        throw "cwebp path not found: $RequestedPath"
    }

    $cmd = Get-Command cwebp -ErrorAction SilentlyContinue
    if ($null -ne $cmd) {
        return $cmd.Source
    }

    throw 'cwebp not found on PATH. Install WebP tools or pass -CwebpPath.'
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
    return [System.Uri]::UnescapeDataString($relativeUri.ToString())
}

try {
    $publicRootPath = (Resolve-Path -LiteralPath $PublicRoot).Path
    $repoRootPath = [System.IO.Path]::GetFullPath((Join-Path $publicRootPath '..'))
    $cwebpExe = Resolve-CwebpExecutable -RequestedPath $CwebpPath

    Write-Host "Using cwebp: $cwebpExe"
    Write-Host "Public root: $publicRootPath"

    $pngFiles = Get-ChildItem -LiteralPath $publicRootPath -Recurse -File | Where-Object { $_.Extension -ieq '.png' }

    $found = $pngFiles.Count
    $converted = 0
    $skipped = 0
    $failed = 0
    $manifestMap = [ordered]@{}

    foreach ($pngFile in $pngFiles) {
        $inputPath = $pngFile.FullName
        $outputPath = [System.IO.Path]::ChangeExtension($inputPath, '.webp')
        $shouldConvert = $true

        if (Test-Path -LiteralPath $outputPath) {
            $existingWebp = Get-Item -LiteralPath $outputPath
            if ($existingWebp.LastWriteTimeUtc -ge $pngFile.LastWriteTimeUtc -and $existingWebp.Length -gt 0) {
                $shouldConvert = $false
            }
        }

        if ($shouldConvert) {
            $args = @()
            if ($Lossless) {
                $args += '-lossless'
            }
            else {
                $args += @('-q', $Quality)
            }
            $args += @('-m', $Method, $inputPath, '-o', $outputPath)

            & $cwebpExe @args
            $convertExitCode = $LASTEXITCODE

            if ($convertExitCode -ne 0) {
                $failed++
                Write-Warning "FAILED: $inputPath (cwebp exit code $convertExitCode)"
                continue
            }

            if (-not (Test-Path -LiteralPath $outputPath)) {
                $failed++
                Write-Warning "FAILED: $inputPath (output not created)"
                continue
            }

            $outputSize = (Get-Item -LiteralPath $outputPath).Length
            if ($outputSize -le 0) {
                $failed++
                Write-Warning "FAILED: $inputPath (output empty)"
                continue
            }

            $converted++
            Write-Host "CONVERTED: $inputPath"
        }
        else {
            $skipped++
            Write-Host "SKIPPED: $inputPath"
        }

        if (Test-Path -LiteralPath $outputPath) {
            $verifiedSize = (Get-Item -LiteralPath $outputPath).Length
            if ($verifiedSize -gt 0) {
                $pngRelative = Get-RelativePathCompat -BasePath $repoRootPath -TargetPath $inputPath
                $webpRelative = Get-RelativePathCompat -BasePath $repoRootPath -TargetPath $outputPath
                $pngRelative = $pngRelative -replace '\\', '/'
                $webpRelative = $webpRelative -replace '\\', '/'
                $manifestMap[$pngRelative] = $webpRelative
            }
        }
    }

    Write-Host "Summary: found=$found converted=$converted skipped=$skipped failed=$failed"
    if ($WriteManifest) {
        $manifestDirectory = Split-Path -Parent $ManifestPath
        if (-not [string]::IsNullOrWhiteSpace($manifestDirectory) -and -not (Test-Path -LiteralPath $manifestDirectory)) {
            New-Item -ItemType Directory -Path $manifestDirectory -Force | Out-Null
        }

        $manifestMap | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath $ManifestPath -Encoding UTF8
        Write-Host "Manifest written: $ManifestPath"
    }
    else {
        Write-Host 'Manifest not written (pass -WriteManifest to emit one).'
    }

    if ($failed -gt 0) {
        exit 1
    }

    exit 0
}
catch {
    Write-Error $_
    exit 1
}
