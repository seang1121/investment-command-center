@echo off
echo ========================================
echo  Fund Analyzer - Starting Services
echo ========================================
echo.

:: Start FastAPI backend
echo [1/2] Starting FastAPI API on port 8000...
start "Fund Analyzer API" cmd /c "cd /d %~dp0 && python -m uvicorn api.main:app --host 0.0.0.0 --port 8000 --reload"

:: Wait a moment for API to start
timeout /t 3 /nobreak >nul

:: Start Next.js frontend
echo [2/2] Starting Next.js frontend on port 3000...
start "Fund Analyzer Frontend" cmd /c "cd /d %~dp0\frontend && npm run dev"

echo.
echo ========================================
echo  Services starting...
echo  API:      http://localhost:8000
echo  Frontend: http://localhost:3000
echo  API Docs: http://localhost:8000/docs
echo ========================================
