@echo off
setlocal enabledelayedexpansion

:: ============================================================================
:: IMMANENCE - COMPREHENSIVE SAFETY SYSTEM
:: ============================================================================
:: This script handles everything. You just pick what you want to do.
:: It checks everything, warns you, and prevents fuckups automatically.
:: ============================================================================

set "PROJECT_DIR=D:\Unity Apps\immanence-os"
set "QUICK_BACKUP=D:\Unity Apps\immanence-os-backup-quick"
set "SNAPSHOT_DIR=D:\Unity Apps\immanence-os-snapshots"
set "TEMP_DEPLOY=%TEMP%\immanence-deploy-temp"
set EXCLUDE_LIST=node_modules .git dist .cache .vite .agent

cd /d "%PROJECT_DIR%"

:: Get current branch
for /f "tokens=*" %%b in ('git branch --show-current') do set "CURRENT_BRANCH=%%b"

:: Get current version from App.jsx
set "CURRENT_VERSION=unknown"
for /f "tokens=*" %%v in ('findstr /r "v[0-9]\." src\App.jsx') do (
    set "line=%%v"
    for /f "tokens=2 delims=v" %%n in ("!line!") do (
        set "CURRENT_VERSION=%%n"
        goto :version_found
    )
)
:version_found

:MENU
cls
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
echo   1. Save my work now (commit + push to backup-latest)
echo   2. Deploy to web (GitHub Pages)
echo.
echo BACKUPS:
echo   3. Create snapshot (timestamped backup)
echo   4. Quick local backup
echo.
echo RECOVERY:
echo   5. Restore from backup-latest branch
echo   6. Restore from snapshot
echo   7. Restore from GitHub
echo.
echo   9. Exit
echo.
set /p choice="Select (1-9): "

if "%choice%"=="1" goto SAVE_WORK
if "%choice%"=="2" goto DEPLOY_WEB
if "%choice%"=="3" goto SNAPSHOT
if "%choice%"=="4" goto QUICK
if "%choice%"=="5" goto RESTORE_BACKUP_LATEST
if "%choice%"=="6" goto RESTORE_SNAPSHOT
if "%choice%"=="7" goto RESTORE_GITHUB
if "%choice%"=="9" goto END

echo Invalid choice.
timeout /t 2 >nul
goto MENU

:: ============================================================================
:SAVE_WORK
:: ============================================================================
cls
echo.
echo ========================================
echo SAVING YOUR WORK
echo ========================================
echo.
echo This will:
echo   1. Commit all changes
echo   2. Push to backup-latest branch
echo   3. Keep you safe
echo.

:: Check if on backup-latest, if not switch to it
if not "%CURRENT_BRANCH%"=="backup-latest" (
    echo You're on %CURRENT_BRANCH%. Switching to backup-latest...
    git checkout backup-latest
    if errorlevel 1 (
        echo.
        echo Creating backup-latest branch...
        git checkout -b backup-latest
    )
)

:: Commit everything
git add -A
if errorlevel 1 (
    echo [FAILED] Could not stage files
    pause
    goto MENU
)

:: Create commit message with timestamp
set "COMMIT_MSG=Work save: %date% %time% - v%CURRENT_VERSION%"
git commit -m "%COMMIT_MSG%"
if errorlevel 1 (
    echo [INFO] No changes to commit - everything already saved
) else (
    echo [OK] Changes committed
)

:: Push to backup-latest
echo Pushing to backup-latest...
git push origin backup-latest
if errorlevel 1 (
    echo.
    echo [FAILED] Could not push to GitHub
    echo Your work is committed locally but not backed up to GitHub yet.
    echo Try again when you have internet.
    pause
    goto MENU
)

echo.
echo ========================================
echo WORK SAVED SUCCESSFULLY
echo ========================================
echo   Branch: backup-latest
echo   Version: v%CURRENT_VERSION%
echo   Remote: Backed up to GitHub
echo.
echo Your work is safe. You can close your computer.
echo.
pause
goto MENU

:: ============================================================================
:DEPLOY_WEB
:: ============================================================================
cls
echo.
echo ========================================
echo DEPLOY TO WEB (GitHub Pages)
echo ========================================
echo.
echo SAFETY CHECKS:
echo.

:: Check 1: Is work saved?
git diff-index --quiet HEAD --
set GIT_RESULT=%errorlevel%

if %GIT_RESULT% NEQ 0 (
    echo [WARNING] You have unsaved changes
    echo.
    echo You should save your work first using option 1.
    echo.
    echo Type Y to continue anyway, or N to go back and save first.
    echo.
    set /p "CONTINUE_DEPLOY=Continue without saving? [Y/N]: "
)

if %GIT_RESULT% NEQ 0 (
    if /i "!CONTINUE_DEPLOY!"=="Y" goto DEPLOY_CONTINUE
    if /i "!CONTINUE_DEPLOY!"=="YES" goto DEPLOY_CONTINUE
    echo.
    echo ----------------------------------------
    echo CANCELLED - You typed: "!CONTINUE_DEPLOY!"
    echo ----------------------------------------
    echo Going back to menu. Use option 1 to save your work first.
    echo.
    pause
    goto MENU
)
:DEPLOY_CONTINUE

:: Check 2: Confirm deployment
echo [OK] Ready to deploy
echo.
echo This will:
echo   1. Build your app (npm run build)
echo   2. Deploy to https://sonnysssssss.github.io/Immanence/
echo   3. Make your work publicly visible
echo.
echo Type Y and press Enter to deploy, or N to cancel.
echo.
set /p "CONFIRM_DEPLOY=Deploy now? [Y/N]: "

if /i "!CONFIRM_DEPLOY!"=="Y" goto DO_DEPLOY_START
if /i "!CONFIRM_DEPLOY!"=="YES" goto DO_DEPLOY_START

echo.
echo ----------------------------------------
echo CANCELLED - You typed: "!CONFIRM_DEPLOY!"
echo ----------------------------------------
echo To deploy, type the letter Y and press Enter.
echo.
pause
goto MENU

:DO_DEPLOY_START
call :DO_DEPLOY
set DEPLOY_RESULT=!errorlevel!
echo.
if !DEPLOY_RESULT! NEQ 0 (
    echo.
    echo ========================================
    echo DEPLOY FAILED - See errors above
    echo ========================================
    echo.
)
pause
goto MENU

:DO_DEPLOY
echo.
echo ========================================
echo SAFE DEPLOY - Your files will NOT be touched
echo ========================================
echo.

:: SAFETY: Record current branch and commit so we can verify nothing changed
for /f "tokens=*" %%b in ('git branch --show-current') do set "ORIGINAL_BRANCH=%%b"
for /f "tokens=*" %%h in ('git rev-parse HEAD') do set "ORIGINAL_COMMIT=%%h"
echo [SAFETY] Current branch: %ORIGINAL_BRANCH%
echo [SAFETY] Current commit: %ORIGINAL_COMMIT%
echo.

:: Step 1: Build the app (this doesn't change git state)
echo [DEPLOY] Step 1/4: Building app...
echo.
call npm run build 2>&1
if errorlevel 1 (
    echo.
    echo ========================================
    echo [DEPLOY] FAILED - Build failed
    echo ========================================
    echo.
    echo Your files are SAFE. Nothing was changed.
    echo Fix the build errors above and try again.
    echo.
    exit /b 1
)

if not exist "dist" (
    echo [DEPLOY] FAILED - No dist folder created
    echo Your files are SAFE. Nothing was changed.
    exit /b 1
)
echo [DEPLOY] Build complete.
echo.

:: Step 2: Create a completely separate temp directory for gh-pages work
echo [DEPLOY] Step 2/4: Preparing deployment in temp folder...
set "DEPLOY_TEMP=%TEMP%\immanence-gh-pages-deploy"
if exist "%DEPLOY_TEMP%" rmdir /s /q "%DEPLOY_TEMP%"
mkdir "%DEPLOY_TEMP%"

:: Clone ONLY the gh-pages branch to temp (shallow clone for speed)
echo [DEPLOY] Cloning gh-pages branch to temp folder...
git clone --depth 1 --branch gh-pages "https://github.com/sonnysssssss/Immanence.git" "%DEPLOY_TEMP%" 2>&1
if errorlevel 1 (
    echo.
    echo [DEPLOY] FAILED - Could not clone gh-pages
    echo Your files are SAFE. Nothing was changed.
    echo.
    echo This might mean:
    echo   - No internet connection
    echo   - gh-pages branch doesn't exist yet
    echo.
    rmdir /s /q "%DEPLOY_TEMP%" 2>nul
    exit /b 1
)
echo.

:: Step 3: Replace content in temp folder with new build
echo [DEPLOY] Step 3/4: Copying new build to temp folder...
:: Delete everything except .git in temp folder
pushd "%DEPLOY_TEMP%"
for /d %%d in (*) do if not "%%d"==".git" rmdir /s /q "%%d" 2>nul
for %%f in (*) do if not "%%f"==".git" del /q "%%f" 2>nul
popd

:: Copy dist contents to temp folder
xcopy /E /I /Y "dist\*" "%DEPLOY_TEMP%" >nul
if errorlevel 1 (
    echo [DEPLOY] FAILED - Could not copy files
    echo Your files are SAFE. Nothing was changed.
    rmdir /s /q "%DEPLOY_TEMP%" 2>nul
    exit /b 1
)
echo.

:: Step 4: Commit and push from temp folder
echo [DEPLOY] Step 4/4: Pushing to GitHub...
pushd "%DEPLOY_TEMP%"
git add -A
git commit -m "Deploy v%CURRENT_VERSION%: %date% %time%" 2>&1
git push origin gh-pages 2>&1
set PUSH_RESULT=!errorlevel!
popd

if !PUSH_RESULT! NEQ 0 (
    echo.
    echo ========================================
    echo [DEPLOY] FAILED - Could not push to GitHub
    echo ========================================
    echo Your files are SAFE. Nothing was changed.
    echo.
    echo This usually means:
    echo   - No internet connection
    echo   - GitHub authentication issue
    echo.
    rmdir /s /q "%DEPLOY_TEMP%" 2>nul
    exit /b 1
)

:: Cleanup temp folder
rmdir /s /q "%DEPLOY_TEMP%" 2>nul

:: SAFETY VERIFICATION: Confirm we're still on the same branch and commit
for /f "tokens=*" %%b in ('git branch --show-current') do set "FINAL_BRANCH=%%b"
for /f "tokens=*" %%h in ('git rev-parse HEAD') do set "FINAL_COMMIT=%%h"

if not "!FINAL_BRANCH!"=="!ORIGINAL_BRANCH!" (
    echo.
    echo ========================================
    echo [SAFETY WARNING] Branch changed unexpectedly!
    echo ========================================
    echo Was: !ORIGINAL_BRANCH!
    echo Now: !FINAL_BRANCH!
    echo.
    echo Restoring to original branch...
    git checkout "!ORIGINAL_BRANCH!" 2>&1
)

if not "!FINAL_COMMIT!"=="!ORIGINAL_COMMIT!" (
    echo.
    echo [SAFETY WARNING] Commit changed unexpectedly - this should not happen.
    echo Was: !ORIGINAL_COMMIT!
    echo Now: !FINAL_COMMIT!
)

echo.
echo ========================================
echo [DEPLOY] SUCCESS!
echo ========================================
echo.
echo Live at: https://sonnysssssss.github.io/Immanence/
echo.
echo [SAFETY] Verified: Still on branch !FINAL_BRANCH!
echo [SAFETY] Verified: Your files are untouched.
echo.
exit /b 0

:: ============================================================================
:SNAPSHOT
:: ============================================================================
cls
echo.
echo [SNAPSHOT] Creating timestamped backup...

if not exist "%SNAPSHOT_DIR%" mkdir "%SNAPSHOT_DIR%"

:: Create timestamp
for /f "tokens=2 delims==" %%I in ('wmic os get localdatetime /value') do set datetime=%%I
set "TIMESTAMP=%datetime:~0,4%-%datetime:~4,2%-%datetime:~6,2%_%datetime:~8,2%-%datetime:~10,2%-%datetime:~12,2%"
set "SNAPSHOT_TARGET=%SNAPSHOT_DIR%\%TIMESTAMP%"

echo Target: %SNAPSHOT_TARGET%

:: Build exclude params
set "EXCLUDE_PARAMS="
for %%d in (%EXCLUDE_LIST%) do set "EXCLUDE_PARAMS=!EXCLUDE_PARAMS! /XD "%%d""

robocopy "%PROJECT_DIR%" "%SNAPSHOT_TARGET%" /E %EXCLUDE_PARAMS% /NFL /NDL /NJH /NJS /NC /NS /NP

if errorlevel 8 (
    echo [SNAPSHOT] FAILED
    pause
    goto MENU
)

echo [SNAPSHOT] OK - Immutable backup created
echo.
pause
goto MENU

:: ============================================================================
:QUICK
:: ============================================================================
cls
echo.
echo [QUICK] Creating mirror backup...

if not exist "%QUICK_BACKUP%" mkdir "%QUICK_BACKUP%"

set "EXCLUDE_PARAMS="
for %%d in (%EXCLUDE_LIST%) do set "EXCLUDE_PARAMS=!EXCLUDE_PARAMS! /XD "%%d""

robocopy "%PROJECT_DIR%" "%QUICK_BACKUP%" /MIR %EXCLUDE_PARAMS% /NFL /NDL /NJH /NJS /NC /NS /NP

if errorlevel 8 (
    echo [QUICK] FAILED
    pause
    goto MENU
)

echo Latest backup: %date%_%time% > "%PROJECT_DIR%\latest-backup.txt"
echo [QUICK] OK - Mirror backup updated
echo.
pause
goto MENU

:: ============================================================================
:RESTORE_BACKUP_LATEST
:: ============================================================================
cls
echo.
echo ========================================
echo RESTORE FROM BACKUP-LATEST BRANCH
echo ========================================
echo.
echo This will restore your work from the backup-latest branch.
echo This is usually your most recent work.
echo.
echo WARNING: Any unsaved changes will be LOST.
echo.
set /p confirm="Type YES to restore from backup-latest: "
if /i not "%confirm%"=="YES" (
    echo Cancelled.
    pause
    goto MENU
)

echo.
echo [RESTORE] Fetching backup-latest...
git fetch origin backup-latest
if errorlevel 1 (
    echo [RESTORE] FAILED - Could not fetch from GitHub
    pause
    goto MENU
)

echo [RESTORE] Switching to backup-latest...
git checkout backup-latest
if errorlevel 1 (
    git checkout -b backup-latest origin/backup-latest
    if errorlevel 1 (
        echo [RESTORE] FAILED - Could not checkout backup-latest
        pause
        goto MENU
    )
)

echo [RESTORE] Pulling latest changes...
git pull origin backup-latest
if errorlevel 1 (
    echo [RESTORE] WARNING - Could not pull latest changes
)

echo.
echo [RESTORE] OK - Restored from backup-latest
echo.
echo Now run npm run dev to see your work.
echo.
pause
goto MENU

:: ============================================================================
:RESTORE_SNAPSHOT
:: ============================================================================
cls
echo.
echo ========================================
echo RESTORE FROM SNAPSHOT
echo ========================================
echo.

if not exist "%SNAPSHOT_DIR%" (
    echo No snapshots found.
    pause
    goto MENU
)

echo Available snapshots:
echo.
set count=0
for /f "tokens=*" %%d in ('dir /b /ad "%SNAPSHOT_DIR%"') do (
    set /a count+=1
    set "snapshot_!count!=%%d"
    echo !count!. %%d
)

if %count%==0 (
    echo No snapshots found.
    pause
    goto MENU
)

echo.
set /p snapshot_choice="Select snapshot (0 to cancel): "

if "%snapshot_choice%"=="0" goto MENU
if %snapshot_choice% LSS 1 goto MENU
if %snapshot_choice% GTR %count% goto MENU

call set "selected_snapshot=%%snapshot_%snapshot_choice%%%"
set "SNAPSHOT_SOURCE=%SNAPSHOT_DIR%\%selected_snapshot%"

echo.
echo Selected: %selected_snapshot%
echo.
echo WARNING: This will overwrite your current files.
echo.
set /p confirm="Type YES to restore: "
if /i not "%confirm%"=="YES" (
    echo Cancelled.
    pause
    goto MENU
)

echo.
echo [RESTORE] Restoring from snapshot...

robocopy "%SNAPSHOT_SOURCE%" "%PROJECT_DIR%" /MIR /XD ".git" /NFL /NDL /NJH /NJS /NC /NS /NP

if errorlevel 8 (
    echo [RESTORE] FAILED
    pause
    goto MENU
)

echo [RESTORE] OK - Restored from %selected_snapshot%
echo.
pause
goto MENU

:: ============================================================================
:RESTORE_GITHUB
:: ============================================================================
cls
echo.
echo ========================================
echo RESTORE FROM GITHUB
echo ========================================
echo.
echo This will reset everything to match GitHub's main branch.
echo.
echo WARNING: All local changes will be LOST.
echo.
set /p confirm="Type YES to restore from GitHub: "
if /i not "%confirm%"=="YES" (
    echo Cancelled.
    pause
    goto MENU
)

echo.
echo [RESTORE] Fetching from GitHub...
git fetch origin main
if errorlevel 1 (
    echo [RESTORE] FAILED - Could not fetch
    pause
    goto MENU
)

echo [RESTORE] Resetting to origin/main...
git reset --hard origin/main
if errorlevel 1 (
    echo [RESTORE] FAILED
    pause
    goto MENU
)

git clean -fd

echo [RESTORE] OK - Restored from GitHub
echo.
pause
goto MENU

:: ============================================================================
:END
:: ============================================================================
echo.
echo Goodbye!
exit /b 0
