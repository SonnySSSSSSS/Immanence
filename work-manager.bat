@echo on
setlocal EnableExtensions EnableDelayedExpansion

:: ============================================================================
:: IMMANENCE OS - WORK MANAGER (SAFE)
:: ============================================================================
:: Goals:
:: - Always show correct branch/version (refresh every menu)
:: - Save Work WITHOUT switching branches (push HEAD -> backup-latest)
:: - Backups/restores that do not "half succeed" silently (logs + robocopy checks)
:: - Restore workflow that doesn't rely on copy scripts alone (git reset options included)
:: ============================================================================

:: ---- CONFIG (edit these only) ----------------------------------------------
set "PROJECT_DIR=D:\Unity Apps\immanence-os"
set "QUICK_BACKUP=D:\Unity Apps\immanence-os-backup-quick"
set "SNAPSHOT_DIR=D:\Unity Apps\immanence-os-snapshots"
set "DEPLOY_REPO=https://github.com/sonnysssssss/Immanence.git"
set "DEPLOY_URL=https://sonnysssssss.github.io/Immanence/"

:: Exclusions for file backups (robocopy)
set "EXCLUDE_LIST=node_modules .git dist .cache .vite .agent"

:: ---- ENTER REPO ------------------------------------------------------------
cd /d "%PROJECT_DIR%" || (
  echo [FATAL] Could not cd to PROJECT_DIR:
  echo   %PROJECT_DIR%
  echo [ERROR] Script exited at %~nx0 line %~nx0
  pause
  exit /b 1
)

call :ASSERT_REPO || (
  echo [ERROR] Script exited at %~nx0 line %~nx0
  pause
  exit /b 1
)

:: ============================================================================
:: MENU
:: ============================================================================
:MENU
call :REFRESH_STATUS
cls
echo.
echo ============================================
echo IMMANENCE - WORK MANAGEMENT SYSTEM (SAFE)
echo ============================================
echo.
echo CURRENT STATUS:
echo   Branch:  %CURRENT_BRANCH%
echo   Version: v%CURRENT_VERSION%
echo   Repo:    %PROJECT_DIR%
echo.
echo ============================================
echo.
echo DAILY WORK:
echo   1. Save my work now  (commit + push HEAD -> backup-latest)
echo   2. Deploy to web     (GitHub Pages)
echo.
echo BACKUPS:
echo   3. Create snapshot   (timestamped backup)
echo   4. Quick mirror backup
echo.
echo RECOVERY:
echo   5. Restore from backup-latest (git reset --hard origin/backup-latest)
echo   6. Restore from snapshot      (robocopy /MIR with log)
echo   7. Restore from GitHub main   (git reset --hard origin/main)
echo.
echo   9. Exit
echo.
set /p choice="Select (1-9): "

if "%choice%"=="1" goto SAVE_WORK
if "%choice%"=="2" goto deploy
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
:: SUBROUTINES (SAFETY)
:: ============================================================================
:ASSERT_REPO
if not exist "%PROJECT_DIR%\.git" (
  echo [FATAL] PROJECT_DIR is not a git repo:
  echo   %PROJECT_DIR%
  echo [ERROR] Script exited at %~nx0 line %~nx0
  pause
  exit /b 1
)
exit /b 0

:REFRESH_STATUS
:: Current branch
for /f "tokens=*" %%b in ('git branch --show-current 2^>nul') do set "CURRENT_BRANCH=%%b"
if "%CURRENT_BRANCH%"=="" set "CURRENT_BRANCH=unknown"

:: Current version from src\App.jsx (best effort)
set "CURRENT_VERSION=unknown"
for /f "tokens=*" %%v in ('findstr /c:"v3." src\App.jsx ^| findstr /v "className" 2^>nul') do (
  set "line=%%v"
  set "line=!line:*v3.=3.!"
  for /f "tokens=1 delims=<" %%n in ("!line!") do (
    set "CURRENT_VERSION=%%n"
    goto :version_found
  )
)
:version_found
exit /b 0

:BUILD_EXCLUDES
set "EXCLUDE_PARAMS="
for %%d in (%EXCLUDE_LIST%) do set "EXCLUDE_PARAMS=!EXCLUDE_PARAMS! /XD ""%%d"""
exit /b 0

:ROBOCHECK
:: Usage: call :ROBOCHECK %errorlevel%
set "RC=%~1"
:: Robocopy codes: 0-7 are OK/success-with-info, 8+ are failures.
if %RC% GEQ 8 (
  echo [ROBOCOPY] FAILED with code %RC%
  echo [ERROR] Script exited at %~nx0 line %~nx0
  pause
  exit /b 1
)
echo [ROBOCOPY] OK (code %RC%)
exit /b 0

:KILL_VITE_5173
:: Best-effort: kill anything holding port 5173 (LISTENING)
for /f "tokens=5" %%p in ('netstat -ano ^| findstr ":5173" ^| findstr "LISTENING"') do (
  taskkill /F /PID %%p >nul 2>&1
)
exit /b 0

:: ============================================================================
:: 1) SAVE WORK (NO BRANCH SWITCH)
:: ============================================================================
:SAVE_WORK
call :REFRESH_STATUS
cls
echo.
echo ========================================
echo SAVE WORK (SAFE)
echo ========================================
echo.
echo This will:
echo   1) git add -A
echo   2) git commit (if needed)
echo   3) push current HEAD to origin/backup-latest (WITHOUT switching branches)
echo.
echo You are on: %CURRENT_BRANCH% (v%CURRENT_VERSION%)
echo.

:: Stage everything
git add -A
if errorlevel 1 (
  echo [FAILED] Could not stage files
  pause
  goto MENU
)

:: Commit (if needed)
set "COMMIT_MSG=Work save: %date% %time% - v%CURRENT_VERSION%"
git commit -m "%COMMIT_MSG%" 2>nul
if errorlevel 1 (
  echo [INFO] No changes to commit (already clean)
) else (
  echo [OK] Changes committed
)

:: Push HEAD -> backup-latest without checkout
echo.
echo [PUSH] Updating origin/backup-latest from current HEAD...
git push origin HEAD:backup-latest
if errorlevel 1 (
  echo.
  echo [FAILED] Could not push to GitHub.
  echo Your work is saved locally; remote backup did not update.
  echo Check internet / auth and re-run Save Work.
  pause
  goto MENU
)

echo.
echo ========================================
echo WORK SAVED SUCCESSFULLY
echo ========================================
echo   Current branch: %CURRENT_BRANCH%
echo   Remote backup:  origin/backup-latest updated from HEAD
echo   Version:        v%CURRENT_VERSION%
echo.
pause
goto MENU

:: ============================================================================
:: 2) DEPLOY WEB (SAFE)
:: ============================================================================
:deploy
setlocal EnableExtensions EnableDelayedExpansion

REM Ensure logs folder exists
if not exist "logs" mkdir "logs" >nul 2>&1

REM Timestamp for log name (YYYYMMDD-HHMMSS)
for /f "tokens=2 delims==" %%I in ('wmic os get localdatetime /value ^| find "="') do set "dt=%%I"
set "ts=!dt:~0,8!-!dt:~8,6!"
set "LOG=logs\deploy-!ts!.log"

echo.
echo.>> "!LOG!"
echo ============================================
echo ============================================>> "!LOG!"
echo DEPLOY START  !date! !time!
echo DEPLOY START  !date! !time!>> "!LOG!"
echo Repo: %cd%
echo Repo: %cd%>> "!LOG!"
echo ============================================
echo ============================================>> "!LOG!"
echo.
echo.>> "!LOG!"

call :run_step "git status"            git status
if errorlevel 1 goto deploy_fail
call :run_step "git fetch --prune"     git fetch --prune
if errorlevel 1 goto deploy_fail
call :run_step "npm ci (optional)"     npm ci
if errorlevel 1 goto deploy_fail
call :run_step "npm run build"         npm run build
if errorlevel 1 goto deploy_fail

REM If you use a specific deploy command, keep it here. Common patterns:
REM - npm run deploy
REM - npx gh-pages -d dist
REM - git push origin main (or working) etc
call :run_step "npm run deploy"        npm run deploy
if errorlevel 1 goto deploy_fail

echo.
echo.>> "!LOG!"

:deploy_fail
echo.
echo ============================================>> "%LOG%"
echo DEPLOY FAILED  %date% %time%>> "%LOG%"
echo ============================================>> "%LOG%"
echo.
echo !!! DEPLOY FAILED. See log: %LOG%
echo.
pause
endlocal
goto menu

echo ============================================
echo ============================================>> "!LOG!"
echo DEPLOY SUCCESS  !date! !time!
echo DEPLOY SUCCESS  !date! !time!>> "!LOG!"
echo Log: !LOG!
echo Log: !LOG!>> "!LOG!"
echo ============================================
echo ============================================>> "!LOG!"
echo.
pause
endlocal
goto MENU

:run_step
setlocal EnableExtensions EnableDelayedExpansion

set "STEP_LABEL=%~1"
shift

echo.
echo ---- %STEP_LABEL% ----
echo ---- %STEP_LABEL% ---->> "%LOG%"

REM Build CMDLINE from the remaining args (%1..), preserving any quotes
set "CMDLINE="
:rs_build
if "%~1"=="" goto rs_built
set "CMDLINE=!CMDLINE! %1"
shift
goto rs_build

:rs_built
REM Trim leading space
if defined CMDLINE set "CMDLINE=!CMDLINE:~1!"

echo CMD: !CMDLINE!
echo CMD: !CMDLINE!>> "%LOG%"

set "STEP_LOG=%TEMP%\deploy-step-%RANDOM%-%RANDOM%.log"
call !CMDLINE! 1>"!STEP_LOG!" 2>&1
set "EC=!errorlevel!"

type "!STEP_LOG!"
type "!STEP_LOG!" 1>> "%LOG%"
del "!STEP_LOG!" 1>nul 2>&1

endlocal & exit /b %EC%

:: ============================================================================
:: 3) SNAPSHOT (TIMESTAMPED)
:: ============================================================================
:SNAPSHOT
call :REFRESH_STATUS
cls
echo.
echo ========================================
echo SNAPSHOT (TIMESTAMPED, IMMUTABLE)
echo ========================================
echo.

if not exist "%SNAPSHOT_DIR%" mkdir "%SNAPSHOT_DIR%"

for /f "tokens=2 delims==" %%I in ('wmic os get localdatetime /value') do set "datetime=%%I"
set "TIMESTAMP=%datetime:~0,4%-%datetime:~4,2%-%datetime:~6,2%_%datetime:~8,2%-%datetime:~10,2%-%datetime:~12,2%"
set "SNAPSHOT_TARGET=%SNAPSHOT_DIR%\%TIMESTAMP%"
mkdir "%SNAPSHOT_TARGET%" >nul 2>&1

call :BUILD_EXCLUDES
set "LOGFILE=%SNAPSHOT_TARGET%\_robocopy_snapshot.log"

echo [SNAPSHOT] From: %PROJECT_DIR%
echo [SNAPSHOT] To:   %SNAPSHOT_TARGET%
echo [SNAPSHOT] Log:  %LOGFILE%
echo.

robocopy "%PROJECT_DIR%" "%SNAPSHOT_TARGET%" /E %EXCLUDE_PARAMS% /R:2 /W:1 /FFT /Z /NP /LOG:"%LOGFILE%"
set "RC=%errorlevel%"
call :ROBOCHECK %RC% || (
  echo.
  echo [SNAPSHOT] FAILED - see log:
  echo   %LOGFILE%
  pause
  goto MENU
)

echo.
echo [SNAPSHOT] OK - created: %TIMESTAMP%
pause
goto MENU

:: ============================================================================
:: 4) QUICK MIRROR BACKUP
:: ============================================================================
:QUICK
call :REFRESH_STATUS
cls
echo.
echo ========================================
echo QUICK MIRROR BACKUP
echo ========================================
echo.

if not exist "%QUICK_BACKUP%" mkdir "%QUICK_BACKUP%"

call :BUILD_EXCLUDES
set "LOGFILE=%QUICK_BACKUP%\_robocopy_quick.log"

echo [QUICK] From: %PROJECT_DIR%
echo [QUICK] To:   %QUICK_BACKUP%
echo [QUICK] Log:  %LOGFILE%
echo.

robocopy "%PROJECT_DIR%" "%QUICK_BACKUP%" /MIR %EXCLUDE_PARAMS% /R:2 /W:1 /FFT /Z /NP /LOG:"%LOGFILE%"
set "RC=%errorlevel%"
call :ROBOCHECK %RC% || (
  echo.
  echo [QUICK] FAILED - see log:
  echo   %LOGFILE%
  pause
  goto MENU
)

echo Latest backup: %date%_%time% > "%PROJECT_DIR%\latest-backup.txt"
echo.
echo [QUICK] OK - mirror updated
pause
goto MENU

:: ============================================================================
:: 5) RESTORE FROM backup-latest (GIT HARD RESET)
:: ============================================================================
:RESTORE_BACKUP_LATEST
call :REFRESH_STATUS
cls
echo.
echo ========================================
echo RESTORE FROM backup-latest (GIT)
echo ========================================
echo.
echo This will:
echo   - git fetch origin backup-latest
echo   - git reset --hard origin/backup-latest
echo   - git clean -fd
echo.
echo WARNING: All local changes will be LOST.
echo.
set /p confirm="Type YES to restore from backup-latest: "
if /i not "%confirm%"=="YES" (
  echo Cancelled.
  pause
  goto MENU
)

echo.
echo [RESTORE] Fetching origin/backup-latest...
git fetch origin backup-latest
if errorlevel 1 (
  echo [RESTORE] FAILED - fetch failed
  pause
  goto MENU
)

echo [RESTORE] Resetting working tree to origin/backup-latest...
git reset --hard origin/backup-latest
if errorlevel 1 (
  echo [RESTORE] FAILED - reset failed
  pause
  goto MENU
)

git clean -fd

echo.
echo [RESTORE] OK - now run:
echo   npm install
echo   npm run dev
echo.
pause
goto MENU

:: ============================================================================
:: 6) RESTORE FROM SNAPSHOT (ROBOCOPY /MIR)
:: ============================================================================
:RESTORE_SNAPSHOT
call :REFRESH_STATUS
cls
echo.
echo ========================================
echo RESTORE FROM SNAPSHOT (FILES)
echo ========================================
echo.

if not exist "%SNAPSHOT_DIR%" (
  echo No snapshots folder:
  echo   %SNAPSHOT_DIR%
  pause
  goto MENU
)

set count=0
for /f "tokens=*" %%d in ('dir /b /ad "%SNAPSHOT_DIR%" 2^>nul') do (
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
echo WARNING: This overwrites current files (except .git).
echo.
set /p confirm="Type YES to restore snapshot: "
if /i not "%confirm%"=="YES" (
  echo Cancelled.
  pause
  goto MENU
)

echo.
echo [RESTORE] Stopping dev server (best effort)...
call :KILL_VITE_5173

set "LOGFILE=%SNAPSHOT_SOURCE%\_robocopy_restore_to_project.log"
echo [RESTORE] From: %SNAPSHOT_SOURCE%
echo [RESTORE] To:   %PROJECT_DIR%
echo [RESTORE] Log:  %LOGFILE%
echo.

robocopy "%SNAPSHOT_SOURCE%" "%PROJECT_DIR%" /MIR /XD ".git" /R:2 /W:1 /FFT /Z /NP /LOG:"%LOGFILE%"
set "RC=%errorlevel%"
call :ROBOCHECK %RC% || (
  echo.
  echo [RESTORE] FAILED - see log:
  echo   %LOGFILE%
  pause
  goto MENU
)

echo.
echo [RESTORE] OK - Restored from %selected_snapshot%
echo Next:
echo   npm install
echo   npm run dev
echo.
pause
goto MENU

:: ============================================================================
:: 7) RESTORE FROM GITHUB main (GIT HARD RESET)
:: ============================================================================
:RESTORE_GITHUB
call :REFRESH_STATUS
cls
echo.
echo ========================================
echo RESTORE FROM GITHUB main (GIT)
echo ========================================
echo.
echo This will:
echo   - git fetch origin main
echo   - git reset --hard origin/main
echo   - git clean -fd
echo.
echo WARNING: All local changes will be LOST.
echo.
set /p confirm="Type YES to restore from GitHub main: "
if /i not "%confirm%"=="YES" (
  echo Cancelled.
  pause
  goto MENU
)

echo.
echo [RESTORE] Fetching origin/main...
git fetch origin main
if errorlevel 1 (
  echo [RESTORE] FAILED - fetch failed
  pause
  goto MENU
)

echo [RESTORE] Resetting working tree to origin/main...
git reset --hard origin/main
if errorlevel 1 (
  echo [RESTORE] FAILED - reset failed
  pause
  goto MENU
)

git clean -fd

echo.
echo [RESTORE] OK - now run:
echo   npm install
echo   npm run dev
echo.
pause
goto MENU

:: ============================================================================
:: END
:: ============================================================================
:END
echo.
echo Goodbye!
echo.
echo [WORK-MANAGER] Script finished.
pause
exit /b 0
