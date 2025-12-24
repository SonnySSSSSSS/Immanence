@echo off
REM ComfyUI Generator Wrapper
REM Usage: generate_asset.bat "prompt text" [output_path]

set SCRIPT_DIR=%~dp0
set COMFYUI_CLIENT=%SCRIPT_DIR%tools\comfyui_client.py

if "%~1"=="" (
    echo Usage: generate_asset.bat "prompt text" [output_path]
    echo Example: generate_asset.bat "mystical avatar" public/avatars/test.png
    exit /b 1
)

set PROMPT=%~1
set OUTPUT=%~2

if "%OUTPUT%"=="" (
    REM No output specified, use default
    python "%COMFYUI_CLIENT%" --prompt "%PROMPT%"
) else (
    python "%COMFYUI_CLIENT%" --prompt "%PROMPT%" --output "%OUTPUT%"
)
