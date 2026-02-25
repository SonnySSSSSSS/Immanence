[CmdletBinding()]
param(
    [string]$CwebpPath,
    [string]$TempDir = [System.IO.Path]::GetTempPath()
)

$ErrorActionPreference = 'Stop'
$PSNativeCommandUseErrorActionPreference = $false
$script:FailureCode = 1
$probeDir = $null
$scriptDirectory = Split-Path -Parent $PSCommandPath

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

try {
    # // PROBE:webp:START
    $cwebpExe = Resolve-CwebpExecutable -RequestedPath $CwebpPath
    Write-Host "Using cwebp: $cwebpExe"

    Write-Host 'Running: cwebp -version'
    & $cwebpExe -version
    $versionExitCode = $LASTEXITCODE
    if ($versionExitCode -ne 0) {
        $script:FailureCode = $versionExitCode
        throw "cwebp -version failed with exit code $versionExitCode"
    }

    if (-not (Test-Path -LiteralPath $TempDir)) {
        New-Item -ItemType Directory -Path $TempDir | Out-Null
    }

    $probeDir = Join-Path $TempDir ("cwebp-probe-" + [guid]::NewGuid().ToString('N'))
    New-Item -ItemType Directory -Path $probeDir | Out-Null

    $inputPng = Join-Path $probeDir 'probe.png'
    $outputWebp = Join-Path $probeDir 'probe.webp'

    $tinyPngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO7+0GQAAAAASUVORK5CYII='
    [System.IO.File]::WriteAllBytes($inputPng, [System.Convert]::FromBase64String($tinyPngBase64))

    if (-not (Test-Path -LiteralPath $inputPng)) {
        throw "Failed to create temporary PNG: $inputPng"
    }

    Write-Host "Running probe conversion: $inputPng -> $outputWebp"
    & $cwebpExe -q 75 -m 4 $inputPng -o $outputWebp
    $convertExitCode = $LASTEXITCODE
    if ($convertExitCode -ne 0) {
        $script:FailureCode = $convertExitCode
        throw "Probe conversion failed with exit code $convertExitCode"
    }

    if (-not (Test-Path -LiteralPath $outputWebp)) {
        throw "Probe conversion did not create output file: $outputWebp"
    }

    $size = (Get-Item -LiteralPath $outputWebp).Length
    if ($size -le 0) {
        throw "Probe conversion output is empty: $outputWebp"
    }

    Write-Host "Probe output size: $size bytes"
    Write-Host 'OK: cwebp callable and conversion succeeded'
    # // PROBE:webp:END
    exit 0
}
catch {
    Write-Error $_
    exit $script:FailureCode
}
finally {
    if ($null -ne $probeDir -and (Test-Path -LiteralPath $probeDir)) {
        Remove-Item -LiteralPath $probeDir -Recurse -Force -ErrorAction SilentlyContinue
    }

    # Defensive cleanup for any legacy probe artifacts in common working locations.
    $legacyProbeFiles = @(
        (Join-Path $scriptDirectory 'tmp_probe.webp'),
        (Join-Path $scriptDirectory 'tmp_probe.png'),
        (Join-Path (Get-Location) 'tmp_probe.webp'),
        (Join-Path (Get-Location) 'tmp_probe.png')
    )
    foreach ($probeFile in $legacyProbeFiles) {
        if (Test-Path -LiteralPath $probeFile) {
            Remove-Item -LiteralPath $probeFile -Force -ErrorAction SilentlyContinue
        }
    }
}
