@echo off
TITLE Movie Recommendation System Runner

:: Display a nice header
echo ============================================================
echo      MOVIE RECOMMENDATION SYSTEM - STARTUP SCRIPT
echo ============================================================
echo.

:: Ensure we are in the project root directory
cd /d "%~dp0"

:: Check if backend directory exists
if not exist "backend" (
    echo [ERROR] Backend directory not found!
    pause
    exit /b
)

:: Check if frontend directory exists
if not exist "frontend" (
    echo [ERROR] Frontend directory not found!
    pause
    exit /b
)

:: Start Backend in a new window
echo [SYSTEM] Starting Backend Server...
start "Backend Server (Flask)" cmd /k "cd backend && ..\venv\Scripts\python app.py"

:: Start Frontend in a new window
echo [SYSTEM] Starting Frontend Client...
start "Frontend Client (Vite)" cmd /k "cd frontend && npm run dev"

:: Wait for services to initialize and open browser
echo [SYSTEM] Waiting for services to start...
timeout /t 5 /nobreak > nul

echo [SYSTEM] Opening Movie Recommendation System in browser...
start http://localhost:5173

echo.
echo ============================================================
echo  Success: Both services are launching.
echo  - Backend: http://127.0.0.1:5000
echo  - Frontend: http://localhost:5173
echo ============================================================
echo.
pause
