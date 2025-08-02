@echo off
REM Personal Finance Assistant Startup Script for Windows
REM This script sets up and starts the entire application

setlocal enabledelayedexpansion

echo ======================================================================
echo 🎯 PERSONAL FINANCE ASSISTANT - SETUP ^& STARTUP
echo ======================================================================
echo.

echo [INFO] Checking prerequisites...

REM Check Node.js
node --version >nul 2>&1
if !errorlevel! neq 0 (
    echo [ERROR] Node.js is not installed. Please install Node.js v14 or higher.
    pause
    exit /b 1
) else (
    for /f %%i in ('node --version') do set NODE_VERSION=%%i
    echo [SUCCESS] Node.js is installed: !NODE_VERSION!
)

REM Check npm
npm --version >nul 2>&1
if !errorlevel! neq 0 (
    echo [ERROR] npm is not installed. Please install npm.
    pause
    exit /b 1
) else (
    for /f %%i in ('npm --version') do set NPM_VERSION=%%i
    echo [SUCCESS] npm is installed: !NPM_VERSION!
)

REM Check Python
python --version >nul 2>&1
if !errorlevel! neq 0 (
    python3 --version >nul 2>&1
    if !errorlevel! neq 0 (
        echo [ERROR] Python is not installed. Please install Python 3.8 or higher.
        pause
        exit /b 1
    ) else (
        set PYTHON_CMD=python3
        for /f "tokens=2" %%i in ('python3 --version') do set PYTHON_VERSION=%%i
    )
) else (
    set PYTHON_CMD=python
    for /f "tokens=2" %%i in ('python --version') do set PYTHON_VERSION=%%i
)
echo [SUCCESS] Python is installed: !PYTHON_VERSION!

REM Check pip
pip --version >nul 2>&1
if !errorlevel! neq 0 (
    pip3 --version >nul 2>&1
    if !errorlevel! neq 0 (
        echo [ERROR] pip is not installed. Please install pip.
        pause
        exit /b 1
    ) else (
        set PIP_CMD=pip3
    )
) else (
    set PIP_CMD=pip
)

REM Check MongoDB
mongod --version >nul 2>&1
if !errorlevel! neq 0 (
    echo [WARNING] MongoDB is not installed or not in PATH.
    echo [WARNING] Please install MongoDB or ensure it's running on localhost:27017
) else (
    echo [SUCCESS] MongoDB is installed
    
    REM Check if MongoDB is running
    netstat -an | find "27017" >nul 2>&1
    if !errorlevel! neq 0 (
        echo [INFO] Starting MongoDB...
        start "" mongod
        timeout /t 3 >nul
        netstat -an | find "27017" >nul 2>&1
        if !errorlevel! neq 0 (
            echo [WARNING] Could not start MongoDB automatically. Please start it manually.
        ) else (
            echo [SUCCESS] MongoDB started successfully
        )
    ) else (
        echo [SUCCESS] MongoDB is already running on port 27017
    )
)

REM Check Tesseract
tesseract --version >nul 2>&1
if !errorlevel! neq 0 (
    echo [WARNING] Tesseract OCR is not installed.
    echo [WARNING] Please install Tesseract OCR manually from:
    echo [WARNING] https://github.com/UB-Mannheim/tesseract/wiki
) else (
    echo [SUCCESS] Tesseract OCR is installed
)

REM Check if ports are available
echo [INFO] Checking port availability...

netstat -an | find ":3000 " >nul 2>&1
if !errorlevel! equ 0 (
    echo [ERROR] Port 3000 is already in use. Please stop the service using this port.
    pause
    exit /b 1
) else (
    echo [SUCCESS] Port 3000 is available ^(Host Server^)
)

netstat -an | find ":5000 " >nul 2>&1
if !errorlevel! equ 0 (
    echo [ERROR] Port 5000 is already in use. Please stop the service using this port.
    pause
    exit /b 1
) else (
    echo [SUCCESS] Port 5000 is available ^(Backend API^)
)

netstat -an | find ":5001 " >nul 2>&1
if !errorlevel! equ 0 (
    echo [ERROR] Port 5001 is already in use. Please stop the service using this port.
    pause
    exit /b 1
) else (
    echo [SUCCESS] Port 5001 is available ^(OCR Service^)
)

REM Install dependencies
echo [INFO] Installing dependencies...

REM Backend dependencies
if exist "backend\package.json" (
    echo [INFO] Installing backend dependencies...
    cd backend
    call npm install
    if !errorlevel! neq 0 (
        echo [ERROR] Failed to install backend dependencies
        cd ..
        pause
        exit /b 1
    )
    cd ..
    echo [SUCCESS] Backend dependencies installed
) else (
    echo [ERROR] Backend package.json not found
    pause
    exit /b 1
)

REM Frontend dependencies
if exist "frontend\package.json" (
    echo [INFO] Installing frontend dependencies...
    cd frontend
    call npm install
    if !errorlevel! neq 0 (
        echo [ERROR] Failed to install frontend dependencies
        cd ..
        pause
        exit /b 1
    )
    cd ..
    echo [SUCCESS] Frontend dependencies installed
) else (
    echo [ERROR] Frontend package.json not found
    pause
    exit /b 1
)

REM Flask OCR service dependencies
if exist "flask-server\requirements.txt" (
    echo [INFO] Installing Python dependencies...
    cd flask-server
    !PIP_CMD! install -r requirements.txt
    if !errorlevel! neq 0 (
        echo [ERROR] Failed to install Python dependencies
        cd ..
        pause
        exit /b 1
    )
    cd ..
    echo [SUCCESS] Python dependencies installed
) else (
    echo [ERROR] Flask server requirements.txt not found
    pause
    exit /b 1
)

REM Build frontend
echo [INFO] Building frontend...
cd frontend
call npm run build
if !errorlevel! neq 0 (
    echo [ERROR] Failed to build frontend
    cd ..
    pause
    exit /b 1
)
cd ..
echo [SUCCESS] Frontend built successfully

REM Create necessary directories
echo [INFO] Creating necessary directories...
if not exist "backend\uploads\receipts" mkdir "backend\uploads\receipts"
if not exist "flask-server\uploads" mkdir "flask-server\uploads"
echo [SUCCESS] Directories created

REM Final setup
echo [INFO] Performing final setup...

if not exist "backend\.env" (
    echo [WARNING] Backend .env file not found, using defaults
)

if not exist "flask-server\.env" (
    echo [WARNING] Flask server .env file not found, using defaults
)

echo [SUCCESS] Setup completed successfully!

echo.
echo ======================================================================
echo 🚀 STARTING PERSONAL FINANCE ASSISTANT
echo ======================================================================
echo.

REM Start the application
echo [INFO] Starting the application...
cd flask-server
!PYTHON_CMD! host_app.py

pause