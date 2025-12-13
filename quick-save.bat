@echo off
:: QUICK SAVE - Run this whenever you stop working
:: Takes 5 seconds, saves your ass

cd /d "D:\Unity Apps\immanence-os"

echo Saving your work...

git checkout backup-latest 2>nul || git checkout -b backup-latest

git add -A
git commit -m "Quick save: %date% %time%"
git push origin backup-latest

if errorlevel 1 (
    echo.
    echo Could not push to GitHub. Your work is saved locally.
    echo Push it later when you have internet.
) else (
    echo.
    echo Work saved to GitHub. You're safe.
)

timeout /t 3
