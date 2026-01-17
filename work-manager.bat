@echo off
setlocal enabledelayedexpansion

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
  pause
  exit /b 1
)

call :ASSERT_REPO || exit /b 1

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
:: SUBROUTINES (SAFETY)
:: ============================================================================
:ASSERT_REPO
if not exist "%PROJECT_DIR%\.git" (
  echo [FATAL] PROJECT_DIR is not a git repo:
  echo   %PROJECT_DIR%
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
:: 2) DEPLOY WEB (SAFE, TEMP CLONE)
:: ============================================================================
:DEPLOY_WEB
call :REFRESH_STATUS
cls
echo.
echo ========================================
echo DEPLOY TO WEB (GitHub Pages)
echo ========================================
echo.

:: Warn if dirty
git diff-index --quiet HEAD --
if errorlevel 1 (
  echo [WARNING] You have uncommitted changes.
  echo Recommend: run option 1 (Save Work) first.
  echo.
  set /p "CONTINUE_DEPLOY=Continue anyway? [Y/N]: "
  if /i not "!CONTINUE_DEPLOY!"=="Y" (
    echo Cancelled.
    pause
    goto MENU
  )
)

echo.
echo This will:
echo   1) npm run build
echo   2) push dist -> gh-pages (via temp clone)
echo   3) NOT touch your working tree
echo.
set /p "CONFIRM_DEPLOY=Deploy now? [Y/N]: "
if /i not "!CONFIRM_DEPLOY!"=="Y" (
  echo Cancelled.
  pause
  goto MENU
)

call :DO_DEPLOY
set "DEPLOY_RESULT=%errorlevel%"
echo.
if "%DEPLOY_RESULT%"=="0" (
    echo ========================================
    echo DEPLOY SUCCESS
    echo ========================================
    echo Live at: %DEPLOY_URL%
    echo.
) else (
    echo ========================================
    echo DEPLOY FAILED
    echo ========================================
    echo Check the output above for the first error.
    echo.
)
pause
goto MENU

:DO_DEPLOY
echo.
echo ========================================
echo DEPLOY (SAFE)
echo ========================================
echo.

for /f "tokens=*" %%b in ('git branch --show-current 2^>nul') do set "ORIGINAL_BRANCH=%%b"
for /f "tokens=*" %%h in ('git rev-parse HEAD 2^>nul') do set "ORIGINAL_COMMIT=%%h"
echo [SAFETY] Branch: %ORIGINAL_BRANCH%
echo [SAFETY] Commit: %ORIGINAL_COMMIT%
echo.

echo [DEPLOY] Building...
if exist "dist" rmdir /s /q "dist"
call npm run build 2>&1
if errorlevel 1 (
  echo [DEPLOY] FAILED - build failed
  exit /b 1
)
if not exist "dist" (
  echo [DEPLOY] FAILED - dist folder missing
  exit /b 1
)

set "DEPLOY_TEMP=%TEMP%\immanence-gh-pages-deploy"
if exist "%DEPLOY_TEMP%" rmdir /s /q "%DEPLOY_TEMP%"
mkdir "%DEPLOY_TEMP%"

echo [DEPLOY] Cloning gh-pages to temp...
git clone --depth 1 --branch gh-pages "%DEPLOY_REPO%" "%DEPLOY_TEMP%" 2>&1
if errorlevel 1 (
  echo [DEPLOY] FAILED - could not clone gh-pages
  rmdir /s /q "%DEPLOY_TEMP%" 2>nul
  exit /b 1
)

echo [DEPLOY] Replacing temp content...
pushd "%DEPLOY_TEMP%"
for /d %%d in (*) do if not "%%d"==".git" rmdir /s /q "%%d" 2>nul
for %%f in (*) do if not "%%f"==".git" del /q "%%f" 2>nul
popd

xcopy /E /I /Y "%PROJECT_DIR%\dist\*" "%DEPLOY_TEMP%\" >nul
if errorlevel 1 (
  echo [DEPLOY] FAILED - copy dist to temp failed
  rmdir /s /q "%DEPLOY_TEMP%" 2>nul
  exit /b 1
)

echo [DEPLOY] Committing + pushing from temp...
pushd "%DEPLOY_TEMP%"
git add -A
git commit -m "Deploy v%CURRENT_VERSION%: %date% %time%" 2>&1
git push origin gh-pages 2>&1
set "PUSH_RESULT=!errorlevel!"
popd

if %PUSH_RESULT% NEQ 0 (
  echo [DEPLOY] FAILED - push gh-pages failed
  rmdir /s /q "%DEPLOY_TEMP%" 2>nul
  exit /b 1
)

rmdir /s /q "%DEPLOY_TEMP%" 2>nul

echo.
echo ========================================
echo DEPLOY SUCCESS
echo ========================================
echo Live at: %DEPLOY_URL%
echo.
exit /b 0

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
exit /b 0
