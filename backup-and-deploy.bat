@echo off
setlocal enabledelayedexpansion

:: Non-interactive entrypoints
:: Usage:
::   backup-and-deploy.bat :DO_DEPLOY
::   backup-and-deploy.bat --deploy
::   backup-and-deploy.bat :DO_DEPLOY_DRY
::   backup-and-deploy.bat --deploy-dry
if /i "%~1"==":DO_DEPLOY" (
  call :DO_DEPLOY
  exit /b %errorlevel%
)
if /i "%~1"=="--deploy" (
  call :DO_DEPLOY
  exit /b %errorlevel%
)
if /i "%~1"==":DO_DEPLOY_DRY" (
  call :DO_DEPLOY_DRY
  exit /b %errorlevel%
)
if /i "%~1"=="--deploy-dry" (
  call :DO_DEPLOY_DRY
  exit /b %errorlevel%
)

:: ============================================================================
:: IMMANENCE - Safety and Deployment System
:: ============================================================================

for %%I in ("%~dp0.") do set "PROJECT_DIR=%%~fI"
set "QUICK_BACKUP=%PROJECT_DIR%-backup-quick"
set "SNAPSHOT_DIR=%PROJECT_DIR%-snapshots"

:: Files and folders to exclude from backups
set EXCLUDE_LIST=node_modules .git dist .cache .vite .agent

:MENU
cls
echo.
echo ============================================
echo IMMANENCE - Backup and Deploy
echo ============================================
echo.
echo BACKUP:
echo 1. Quick backup (fast local mirror)
echo 2. Snapshot (timestamped immutable backup)
echo 3. GitHub push (remote backup)
echo 4. Deploy to GitHub Pages (public site)
echo 5. All of the above
echo.
echo RESTORE:
echo 6. Restore from quick backup
echo 7. Restore from snapshot (choose which)
echo 8. Restore from GitHub
echo.
echo 9. Exit
echo.
set /p choice="Select option (1-9): "

if "%choice%"=="1" goto QUICK
if "%choice%"=="2" goto SNAPSHOT
if "%choice%"=="3" goto GITHUB
if "%choice%"=="4" goto DEPLOY
if "%choice%"=="5" goto ALL
if "%choice%"=="6" goto RESTORE_QUICK
if "%choice%"=="7" goto RESTORE_SNAPSHOT
if "%choice%"=="8" goto RESTORE_GITHUB
if "%choice%"=="9" goto END

echo Invalid choice. Try again.
timeout /t 2 >nul
goto MENU

:: ============================================================================
:ALL
:: ============================================================================
echo.
echo ========================================
echo Running all operations...
echo ========================================
echo.

call :DO_QUICK
if errorlevel 1 (
    echo.
    echo [FAILED] Quick backup failed, stopping.
    pause
    goto MENU
)

call :DO_SNAPSHOT
if errorlevel 1 (
    echo.
    echo [FAILED] Snapshot failed, stopping.
    pause
    goto MENU
)

call :DO_GITHUB
if errorlevel 1 (
    echo.
    echo [FAILED] GitHub push failed, stopping.
    pause
    goto MENU
)

call :DO_DEPLOY
if errorlevel 1 (
    echo.
    echo [FAILED] Deployment failed, stopping.
    pause
    goto MENU
)

echo.
echo ========================================
echo ALL OPERATIONS COMPLETE
echo ========================================
pause
goto MENU

:: ============================================================================
:QUICK
:: ============================================================================
call :DO_QUICK
echo.
pause
goto MENU

:DO_QUICK
echo.
echo [QUICK] Starting fast local mirror backup...

if not exist "%QUICK_BACKUP%" (
    echo [QUICK] Creating backup directory: %QUICK_BACKUP%
    mkdir "%QUICK_BACKUP%"
)

:: Build robocopy exclude parameters
set EXCLUDE_PARAMS=
for %%d in (%EXCLUDE_LIST%) do (
    set EXCLUDE_PARAMS=!EXCLUDE_PARAMS! /XD "%%d"
)

:: Mirror backup (deletes files in destination that don't exist in source)
robocopy "%PROJECT_DIR%" "%QUICK_BACKUP%" /MIR %EXCLUDE_PARAMS% /NFL /NDL /NJH /NJS /NC /NS /NP

if errorlevel 8 (
    echo [QUICK] FAILED - Robocopy error
    exit /b 1
)

:: Update timestamp file
echo Latest backup: %date%_%time% > "%PROJECT_DIR%\latest-backup.txt"

echo [QUICK] OK - Latest working state backed up
exit /b 0

:: ============================================================================
:SNAPSHOT
:: ============================================================================
call :DO_SNAPSHOT
echo.
pause
goto MENU

:DO_SNAPSHOT
echo.
echo [SNAPSHOT] Creating timestamped immutable backup...

if not exist "%SNAPSHOT_DIR%" (
    echo [SNAPSHOT] Creating snapshots directory: %SNAPSHOT_DIR%
    mkdir "%SNAPSHOT_DIR%"
)

:: Create timestamp (format: YYYY-MM-DD_HH-MM-SS)
for /f "tokens=2 delims==" %%I in ('wmic os get localdatetime /value') do set datetime=%%I
set TIMESTAMP=%datetime:~0,4%-%datetime:~4,2%-%datetime:~6,2%_%datetime:~8,2%-%datetime:~10,2%-%datetime:~12,2%

set SNAPSHOT_TARGET=%SNAPSHOT_DIR%\%TIMESTAMP%

echo [SNAPSHOT] Target: %SNAPSHOT_TARGET%

:: Build robocopy exclude parameters
set EXCLUDE_PARAMS=
for %%d in (%EXCLUDE_LIST%) do (
    set EXCLUDE_PARAMS=!EXCLUDE_PARAMS! /XD "%%d"
)

:: Copy to timestamped folder
robocopy "%PROJECT_DIR%" "%SNAPSHOT_TARGET%" /E %EXCLUDE_PARAMS% /NFL /NDL /NJH /NJS /NC /NS /NP

if errorlevel 8 (
    echo [SNAPSHOT] FAILED - Robocopy error
    exit /b 1
)

echo [SNAPSHOT] OK - Immutable snapshot created
exit /b 0

:: ============================================================================
:GITHUB
:: ============================================================================
call :DO_GITHUB
echo.
pause
goto MENU

:DO_GITHUB
echo.
echo [GITHUB] Backing up to remote repository...
echo [GITHUB] LOCAL IS SOURCE OF TRUTH - GitHub will be overwritten if needed
echo.

cd /d "%PROJECT_DIR%"

:: Check if there are local changes to commit
git diff-index --quiet HEAD --
if errorlevel 1 (
    echo [GITHUB] Local changes detected, committing...
    
    git add -A
    if errorlevel 1 (
        echo [GITHUB] FAILED - git add failed
        exit /b 1
    )
    
    git commit -m "Auto-backup %date% %time%"
    if errorlevel 1 (
        echo [GITHUB] FAILED - git commit failed
        exit /b 1
    )
) else (
    echo [GITHUB] No local changes to commit
)

:: Fetch to check remote status
echo [GITHUB] Checking remote status...
git fetch origin main
if errorlevel 1 (
    echo [GITHUB] FAILED - Could not fetch from remote
    exit /b 1
)

:: Check if local is behind, ahead, or diverged from remote
for /f %%i in ('git rev-list --count HEAD..origin/main') do set BEHIND=%%i
for /f %%i in ('git rev-list --count origin/main..HEAD') do set AHEAD=%%i

if %BEHIND% GTR 0 (
    if %AHEAD% GTR 0 (
        echo [GITHUB] WARNING: Local and GitHub have diverged
        echo [GITHUB] Local has %AHEAD% commits ahead, GitHub has %BEHIND% commits you don't have
    ) else (
        echo [GITHUB] WARNING: Local is behind GitHub
        echo [GITHUB] GitHub has %BEHIND% commits you don't have locally
    )
    echo.
    echo This is a BACKUP operation - local will overwrite GitHub.
    echo If you want GitHub's version instead, use option 8 (Restore from GitHub)
    echo.
    set /p confirm="Type YES to force push local to GitHub: "
    if /i not "!confirm!"=="YES" (
        echo [GITHUB] Cancelled - GitHub not updated
        exit /b 1
    )
    
    echo [GITHUB] Force pushing to GitHub (local overwrites remote)...
    git push --force origin main
    if errorlevel 1 (
        echo [GITHUB] FAILED - Force push failed
        exit /b 1
    )
) else (
    :: Local is ahead or equal, safe to push
    echo [GITHUB] Pushing to origin/main...
    git push origin main
    if errorlevel 1 (
        echo [GITHUB] FAILED - git push failed
        exit /b 1
    )
)

echo [GITHUB] OK - Remote backup updated
exit /b 0

:: ============================================================================
:DEPLOY
:: ============================================================================
call :DO_DEPLOY
echo.
pause
goto MENU

:DO_DEPLOY
echo.
echo [DEPLOY] Building and deploying to GitHub Pages...

cd /d "%PROJECT_DIR%"

echo [DEPLOY] Running npm deploy...
call npm run deploy
if errorlevel 1 (
    echo [DEPLOY] FAILED - npm run deploy failed
    exit /b 1
)

echo [DEPLOY] OK - Live at https://sonnysssssss.github.io/Immanence/
exit /b 0

:DO_DEPLOY_DRY
echo.
echo [DEPLOY] Dry-run deploy (no push)...

cd /d "%PROJECT_DIR%"

echo [DEPLOY] Running npm deploy:dry...
call npm run deploy:dry
if errorlevel 1 (
    echo [DEPLOY] FAILED - npm run deploy:dry failed
    exit /b 1
)

echo [DEPLOY] OK - Dry-run completed
exit /b 0

:: ============================================================================
:RESTORE_QUICK
:: ============================================================================
echo.
echo ========================================
echo RESTORE FROM QUICK BACKUP
echo ========================================
echo.
echo WARNING: This will overwrite your current project
echo with the contents of the quick backup.
echo.
echo Any unsaved work will be LOST.
echo.

if not exist "%QUICK_BACKUP%" (
    echo [RESTORE] ERROR - Quick backup not found at:
    echo %QUICK_BACKUP%
    echo.
    pause
    goto MENU
)

set /p confirm="Type YES to confirm restore: "
if /i not "%confirm%"=="YES" (
    echo Restore cancelled.
    pause
    goto MENU
)

echo.
echo [RESTORE] Restoring from quick backup...

:: Build robocopy exclude parameters (exclude .git to preserve repo)
set EXCLUDE_PARAMS=/XD ".git"

:: Copy backup to project, overwriting everything except .git
robocopy "%QUICK_BACKUP%" "%PROJECT_DIR%" /MIR %EXCLUDE_PARAMS% /NFL /NDL /NJH /NJS /NC /NS /NP

if errorlevel 8 (
    echo [RESTORE] FAILED - Robocopy error
    pause
    goto MENU
)

echo [RESTORE] OK - Project restored from quick backup
pause
goto MENU

:: ============================================================================
:RESTORE_SNAPSHOT
:: ============================================================================
echo.
echo ========================================
echo RESTORE FROM SNAPSHOT
echo ========================================
echo.

if not exist "%SNAPSHOT_DIR%" (
    echo [RESTORE] ERROR - No snapshots found at:
    echo %SNAPSHOT_DIR%
    echo.
    pause
    goto MENU
)

:: List all snapshot directories
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
set /p snapshot_choice="Select snapshot number (or 0 to cancel): "

if "%snapshot_choice%"=="0" goto MENU
if %snapshot_choice% LSS 1 goto MENU
if %snapshot_choice% GTR %count% goto MENU

:: Get selected snapshot
call set selected_snapshot=%%snapshot_%snapshot_choice%%%
set SNAPSHOT_SOURCE=%SNAPSHOT_DIR%\%selected_snapshot%

echo.
echo Selected: %selected_snapshot%
echo.
echo WARNING: This will overwrite your current project
echo with the contents of this snapshot.
echo.
echo Any unsaved work will be LOST.
echo.
set /p confirm="Type YES to confirm restore: "
if /i not "%confirm%"=="YES" (
    echo Restore cancelled.
    pause
    goto MENU
)

echo.
echo [RESTORE] Restoring from snapshot...

:: Build robocopy exclude parameters (exclude .git to preserve repo)
set EXCLUDE_PARAMS=/XD ".git"

:: Copy snapshot to project, overwriting everything except .git
robocopy "%SNAPSHOT_SOURCE%" "%PROJECT_DIR%" /MIR %EXCLUDE_PARAMS% /NFL /NDL /NJH /NJS /NC /NS /NP

if errorlevel 8 (
    echo [RESTORE] FAILED - Robocopy error
    pause
    goto MENU
)

echo [RESTORE] OK - Project restored from snapshot: %selected_snapshot%
pause
goto MENU

:: ============================================================================
:RESTORE_GITHUB
:: ============================================================================
echo.
echo ========================================
echo RESTORE FROM GITHUB
echo ========================================
echo.
echo WARNING: This will discard ALL local changes
echo and reset your project to match GitHub.
echo.
echo Any uncommitted work will be LOST.
echo.
set /p confirm="Type YES to confirm restore: "
if /i not "%confirm%"=="YES" (
    echo Restore cancelled.
    pause
    goto MENU
)

echo.
echo [RESTORE] Fetching from GitHub...

cd /d "%PROJECT_DIR%"

:: Fetch latest from GitHub
git fetch origin main
if errorlevel 1 (
    echo [RESTORE] FAILED - Could not fetch from GitHub
    pause
    goto MENU
)

:: Hard reset to match GitHub exactly
echo [RESTORE] Resetting to origin/main...
git reset --hard origin/main
if errorlevel 1 (
    echo [RESTORE] FAILED - Could not reset to origin/main
    pause
    goto MENU
)

:: Clean any untracked files
echo [RESTORE] Cleaning untracked files...
git clean -fd
if errorlevel 1 (
    echo [RESTORE] WARNING - Could not clean untracked files
)

echo [RESTORE] OK - Project restored from GitHub
pause
goto MENU

:: ============================================================================
:END
:: ============================================================================
echo.
echo Goodbye!
exit /b 0
