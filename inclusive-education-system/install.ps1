# Complete Installation Script for Inclusive Education System
# Run this script from the project root directory

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Inclusive Education System - Installer" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check prerequisites
Write-Host "Checking prerequisites..." -ForegroundColor Yellow

# Check Node.js
try {
    $nodeVersion = node --version
    Write-Host "✓ Node.js found: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Node.js not found. Please install Node.js 18+ from https://nodejs.org" -ForegroundColor Red
    exit 1
}

# Check Python
try {
    $pythonVersion = python --version
    Write-Host "✓ Python found: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Python not found. Please install Python 3.9+ from https://python.org" -ForegroundColor Red
    exit 1
}

# Check MySQL
Write-Host "⚠ Please ensure MySQL 8.0+ is installed and running" -ForegroundColor Yellow
Write-Host ""

# Install Backend Dependencies
Write-Host "Installing Backend dependencies..." -ForegroundColor Yellow
Set-Location backend
if (Test-Path "package.json") {
    npm install
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Backend dependencies installed" -ForegroundColor Green
    } else {
        Write-Host "✗ Backend installation failed" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "✗ Backend package.json not found" -ForegroundColor Red
    exit 1
}
Set-Location ..

# Setup Backend Environment
Write-Host ""
Write-Host "Setting up Backend environment..." -ForegroundColor Yellow
if (!(Test-Path "backend/.env")) {
    Copy-Item "backend/.env.example" "backend/.env"
    Write-Host "✓ Created backend/.env from template" -ForegroundColor Green
    Write-Host "⚠ Please edit backend/.env with your MySQL credentials" -ForegroundColor Yellow
} else {
    Write-Host "✓ backend/.env already exists" -ForegroundColor Green
}

# Install AI Services Dependencies
Write-Host ""
Write-Host "Installing AI Services dependencies..." -ForegroundColor Yellow
Set-Location ai-services

# Create virtual environment
if (!(Test-Path "venv")) {
    python -m venv venv
    Write-Host "✓ Created Python virtual environment" -ForegroundColor Green
}

# Activate virtual environment and install packages
& "venv\Scripts\Activate.ps1"
pip install -r requirements.txt
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ AI Services dependencies installed" -ForegroundColor Green
} else {
    Write-Host "✗ AI Services installation failed" -ForegroundColor Red
    deactivate
    Set-Location ..
    exit 1
}
deactivate
Set-Location ..

# Setup AI Services Environment
Write-Host ""
Write-Host "Setting up AI Services environment..." -ForegroundColor Yellow
if (!(Test-Path "ai-services/.env")) {
    Copy-Item "ai-services/.env.example" "ai-services/.env"
    Write-Host "✓ Created ai-services/.env from template" -ForegroundColor Green
    Write-Host "⚠ Please edit ai-services/.env with your MySQL credentials" -ForegroundColor Yellow
} else {
    Write-Host "✓ ai-services/.env already exists" -ForegroundColor Green
}

# Install Frontend Dependencies
Write-Host ""
Write-Host "Installing Frontend dependencies..." -ForegroundColor Yellow
Set-Location frontend
if (Test-Path "package.json") {
    npm install
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Frontend dependencies installed" -ForegroundColor Green
    } else {
        Write-Host "✗ Frontend installation failed" -ForegroundColor Red
        Set-Location ..
        exit 1
    }
} else {
    Write-Host "✗ Frontend package.json not found" -ForegroundColor Red
    Set-Location ..
    exit 1
}
Set-Location ..

# Summary
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Installation Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Configure database credentials in backend/.env and ai-services/.env" -ForegroundColor White
Write-Host "2. Ensure MySQL is running" -ForegroundColor White
Write-Host "3. Run database migrations: cd backend && npm run migrate" -ForegroundColor White
Write-Host "4. Generate Angular components: cd frontend && .\generate-components.ps1" -ForegroundColor White
Write-Host "5. Start services (see QUICK_START.md)" -ForegroundColor White
Write-Host ""
Write-Host "Documentation:" -ForegroundColor Yellow
Write-Host "- Quick Start: QUICK_START.md" -ForegroundColor White
Write-Host "- Full Guide: SETUP_GUIDE.md" -ForegroundColor White
Write-Host "- Project Summary: PROJECT_SUMMARY.md" -ForegroundColor White
Write-Host ""
Write-Host "Default Admin Login:" -ForegroundColor Yellow
Write-Host "Email: admin@inclusive-edu.com" -ForegroundColor White
Write-Host "Password: admin123" -ForegroundColor White
Write-Host ""
