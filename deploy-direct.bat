@echo off
setlocal enabledelayedexpansion

:: ============================================================================
:: IMMANENCE - Direct Deploy (Non-Interactive)
:: ============================================================================
:: This script deploys to GitHub Pages without using the gh-pages npm package,
:: avoiding Windows path-length issues (spawn ENAMETOOLONG).
:: ============================================================================

set PROJECT_DIR=D:\Unity Apps\immanence-os

echo.
echo ========================================
echo IMMANENCE - Direct Deploy to GitHub Pages
echo ========================================
echo.

cd /d "%PROJECT_DIR%"

:: ============================================================================
:: 1. BUILD
:: ============================================================================
echo [1/4] Building application...
call npm run build
if errorlevel 1 (
    echo.
    echo [ERROR] Build failed
    exit /b 1
)

:: Check if dist folder exists
if not exist "dist" (
    echo.
    echo [ERROR] dist folder not found after build
    exit /b 1
)

echo [BUILD] OK
echo.

:: ============================================================================
:: 2. SAVE CURRENT BRANCH
:: ============================================================================
echo [2/4] Saving current branch...
for /f "tokens=*" %%b in ('git branch --show-current') do set CURRENT_BRANCH=%%b
echo Current branch: %CURRENT_BRANCH%
echo.

:: ============================================================================
:: 3. CHECKOUT GH-PAGES
:: ============================================================================
echo [3/4] Switching to gh-pages branch...
git checkout gh-pages
if errorlevel 1 (
    echo.
    echo [ERROR] Could not checkout gh-pages branch
    echo Creating gh-pages branch...
    git checkout -b gh-pages
    if errorlevel 1 (
        echo [ERROR] Could not create gh-pages branch
        git checkout %CURRENT_BRANCH%
        exit /b 1
    )
)

:: ============================================================================
:: 4. CLEAN OLD FILES
:: ============================================================================
echo [4/4] Cleaning old files and deploying...

:: Remove old files (except .git)
for /d %%d in (*) do (
    if not "%%d"==".git" (
        if not "%%d"=="dist" (
            rmdir /s /q "%%d" 2>nul
        )
    )
)
for %%f in (*) do (
    if not "%%f"==".git" (
        if not "%%~xf"==".bat" (
            del /q "%%f" 2>nul
        )
    )
)

:: Copy dist contents to root
xcopy /E /I /Y "dist\*" "." >nul
if errorlevel 1 (
    echo.
    echo [ERROR] Could not copy dist contents
    git checkout %CURRENT_BRANCH%
    exit /b 1
)

:: Remove dist folder now that we've copied everything
rmdir /s /q "dist" 2>nul

:: ============================================================================
:: 5. COMMIT AND PUSH
:: ============================================================================
echo.
echo Committing changes...
git add -A
git commit -m "Deploy: %date% %time%"

echo.
echo Pushing to GitHub Pages...
git push --force origin gh-pages
if errorlevel 1 (
    echo.
    echo [ERROR] Could not push to gh-pages
    git checkout %CURRENT_BRANCH%
    exit /b 1
)

:: ============================================================================
:: 6. RETURN TO ORIGINAL BRANCH
:: ============================================================================
echo.
echo Returning to %CURRENT_BRANCH%...
git checkout %CURRENT_BRANCH%

echo.
echo ========================================
echo DEPLOYMENT COMPLETE
echo ========================================
echo.
echo Live at: https://sonnysssssss.github.io/Immanence/
echo.
echo Note: GitHub Pages may take 1-2 minutes to update.
echo Check cache headers with:
echo   powershell -NoProfile -Command "Invoke-WebRequest -UseBasicParsing -Method Head -Uri 'https://sonnysssssss.github.io/Immanence/' | Select-Object -ExpandProperty Headers"
echo.

exit /b 0
