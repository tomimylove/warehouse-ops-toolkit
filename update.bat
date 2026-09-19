@echo off
cd /d "%~dp0"

echo === git pull ===
git pull
if errorlevel 1 (
    echo.
    echo git pull failed - see the error above.
    pause
    exit /b 1
)

echo.
echo === npm install ===
call npm install
if errorlevel 1 (
    echo.
    echo npm install failed - see the error above.
    pause
    exit /b 1
)

echo.
echo Done. You can close this window.
pause
