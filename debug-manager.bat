@echo off
setlocal enabledelayedexpansion

set "CURRENT_BRANCH=backup-latest"
set "CURRENT_VERSION=3.15.0"
set "PROJECT_DIR=D:\Unity Apps\immanence-os"

:MENU
echo.
echo ============================================
echo IMMANENCE - WORK MANAGEMENT SYSTEM
echo ============================================
echo.
echo CURRENT STATUS:
echo   Branch: %CURRENT_BRANCH%
echo   Version: v%CURRENT_VERSION%
echo   Location: %PROJECT_DIR%
echo.
echo ============================================
echo.
echo WHAT DO YOU WANT TO DO?
echo.
echo DAILY WORK:
echo   1. Save my work now
echo   2. Deploy to web
echo.
echo   9. Exit
echo.
set /p choice="Select (1-9): "

echo You chose: %choice%
pause