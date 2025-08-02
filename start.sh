#!/bin/bash

# Personal Finance Assistant Startup Script
# This script sets up and starts the entire application

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check if a port is in use
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# Header
echo "======================================================================"
echo "🎯 PERSONAL FINANCE ASSISTANT - SETUP & STARTUP"
echo "======================================================================"
echo ""

# Check prerequisites
print_status "Checking prerequisites..."

# Check Node.js
if command_exists node; then
    NODE_VERSION=$(node --version)
    print_success "Node.js is installed: $NODE_VERSION"
else
    print_error "Node.js is not installed. Please install Node.js v14 or higher."
    exit 1
fi

# Check npm
if command_exists npm; then
    NPM_VERSION=$(npm --version)
    print_success "npm is installed: $NPM_VERSION"
else
    print_error "npm is not installed. Please install npm."
    exit 1
fi

# Check Python
if command_exists python3; then
    PYTHON_VERSION=$(python3 --version)
    print_success "Python is installed: $PYTHON_VERSION"
    PYTHON_CMD="python3"
elif command_exists python; then
    PYTHON_VERSION=$(python --version)
    print_success "Python is installed: $PYTHON_VERSION"
    PYTHON_CMD="python"
else
    print_error "Python is not installed. Please install Python 3.8 or higher."
    exit 1
fi

# Check pip
if command_exists pip3; then
    PIP_CMD="pip3"
elif command_exists pip; then
    PIP_CMD="pip"
else
    print_error "pip is not installed. Please install pip."
    exit 1
fi

# Check MongoDB
if command_exists mongod; then
    print_success "MongoDB is installed"
    
    # Check if MongoDB is running
    if check_port 27017; then
        print_success "MongoDB is already running on port 27017"
    else
        print_status "Starting MongoDB..."
        if command_exists brew && [[ "$OSTYPE" == "darwin"* ]]; then
            # macOS with Homebrew
            brew services start mongodb-community >/dev/null 2>&1 || true
        elif command_exists systemctl; then
            # Linux with systemd
            sudo systemctl start mongod >/dev/null 2>&1 || true
        else
            # Try to start manually
            mongod --fork --logpath /tmp/mongodb.log --dbpath /tmp/mongodb-data >/dev/null 2>&1 || true
        fi
        
        # Wait for MongoDB to start
        sleep 3
        if check_port 27017; then
            print_success "MongoDB started successfully"
        else
            print_warning "Could not start MongoDB automatically. Please start it manually."
        fi
    fi
else
    print_warning "MongoDB is not installed or not in PATH."
    print_warning "Please install MongoDB or ensure it's running on localhost:27017"
fi

# Check Tesseract
if command_exists tesseract; then
    TESSERACT_VERSION=$(tesseract --version | head -n1)
    print_success "Tesseract OCR is installed: $TESSERACT_VERSION"
else
    print_warning "Tesseract OCR is not installed."
    print_status "Installing Tesseract OCR..."
    
    if command_exists apt-get; then
        # Ubuntu/Debian
        sudo apt-get update && sudo apt-get install -y tesseract-ocr
    elif command_exists yum; then
        # CentOS/RHEL
        sudo yum install -y tesseract
    elif command_exists brew && [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        brew install tesseract
    else
        print_error "Cannot install Tesseract automatically. Please install it manually."
        print_error "Visit: https://github.com/tesseract-ocr/tesseract#installing-tesseract"
        exit 1
    fi
    
    if command_exists tesseract; then
        print_success "Tesseract OCR installed successfully"
    else
        print_error "Failed to install Tesseract OCR"
        exit 1
    fi
fi

# Check if ports are available
print_status "Checking port availability..."

if check_port 3000; then
    print_error "Port 3000 is already in use. Please stop the service using this port."
    exit 1
else
    print_success "Port 3000 is available (Host Server)"
fi

if check_port 5000; then
    print_error "Port 5000 is already in use. Please stop the service using this port."
    exit 1
else
    print_success "Port 5000 is available (Backend API)"
fi

if check_port 5001; then
    print_error "Port 5001 is already in use. Please stop the service using this port."
    exit 1
else
    print_success "Port 5001 is available (OCR Service)"
fi

# Install dependencies
print_status "Installing dependencies..."

# Backend dependencies
if [ -f "backend/package.json" ]; then
    print_status "Installing backend dependencies..."
    cd backend
    npm install
    cd ..
    print_success "Backend dependencies installed"
else
    print_error "Backend package.json not found"
    exit 1
fi

# Frontend dependencies
if [ -f "frontend/package.json" ]; then
    print_status "Installing frontend dependencies..."
    cd frontend
    npm install
    cd ..
    print_success "Frontend dependencies installed"
else
    print_error "Frontend package.json not found"
    exit 1
fi

# Flask OCR service dependencies
if [ -f "flask-server/requirements.txt" ]; then
    print_status "Installing Python dependencies..."
    cd flask-server
    $PIP_CMD install -r requirements.txt
    cd ..
    print_success "Python dependencies installed"
else
    print_error "Flask server requirements.txt not found"
    exit 1
fi

# Build frontend
print_status "Building frontend..."
cd frontend
npm run build
cd ..
print_success "Frontend built successfully"

# Create necessary directories
print_status "Creating necessary directories..."
mkdir -p backend/uploads/receipts
mkdir -p flask-server/uploads
print_success "Directories created"

# Final setup
print_status "Performing final setup..."

# Check if .env files exist and create them if needed
if [ ! -f "backend/.env" ]; then
    print_warning "Backend .env file not found, using defaults"
fi

if [ ! -f "flask-server/.env" ]; then
    print_warning "Flask server .env file not found, using defaults"
fi

print_success "Setup completed successfully!"

echo ""
echo "======================================================================"
echo "🚀 STARTING PERSONAL FINANCE ASSISTANT"
echo "======================================================================"
echo ""

# Start the application
print_status "Starting the application..."
cd flask-server
$PYTHON_CMD host_app.py