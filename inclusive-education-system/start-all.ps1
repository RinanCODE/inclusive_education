# PowerShell Script to Start All Services
# Run this from the project root directory

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Starting Inclusive Education System" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$projectRoot = Get-Location

# Check if MySQL is running
Write-Host "Checking MySQL service..." -ForegroundColor Yellow
$mysqlService = Get-Service -Name "MySQL*" -ErrorAction SilentlyContinue
if ($mysqlService -and $mysqlService.Status -eq "Running") {
    Write-Host "✓ MySQL is running" -ForegroundColor Green
} else {
    Write-Host "✗ MySQL is not running. Please start MySQL first." -ForegroundColor Red
    Write-Host "  Run: net start MySQL80" -ForegroundColor Yellow
    exit 1
}

Write-Host "" 
Write-Host "Running database migrations..." -ForegroundColor Yellow
Push-Location "$projectRoot\backend"
try {
    node .\database\migrate.js
    if ($LASTEXITCODE -ne 0) { throw "Migrations failed with code $LASTEXITCODE" }
    Write-Host "✓ Migrations applied" -ForegroundColor Green

    Write-Host "Seeding initial courses/modules (if empty)..." -ForegroundColor Yellow
    node .\database\seed_courses.js
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Seeding complete" -ForegroundColor Green
    } else {
        Write-Host "Warning: Seeding script returned non-zero code ($LASTEXITCODE)." -ForegroundColor Yellow
    }
} catch {
    Write-Host "Warning: Migration/Seeding step encountered an issue: $_" -ForegroundColor Yellow
} finally {
    Pop-Location
}

Write-Host ""
Write-Host "Starting services in separate windows..." -ForegroundColor Yellow
Write-Host ""

# Start Backend
Write-Host "1. Starting Backend API (Port 3000)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-Command",
    "cd '$projectRoot\backend'; Write-Host 'Backend API Starting...' -ForegroundColor Green; npm start"
)
Start-Sleep -Seconds 3

# Start AI Services
Write-Host "2. Starting AI Services (Port 5000)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-Command",
    "cd '$projectRoot\ai-services'; Write-Host 'AI Services Starting...' -ForegroundColor Green; .\venv\Scripts\activate; python app.py"
)
Start-Sleep -Seconds 3

# Start Frontend
Write-Host "3. Starting Frontend (Port 4200)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-Command",
    "cd '$projectRoot\frontend'; Write-Host 'Frontend Starting...' -ForegroundColor Green; ng serve"
)

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "All Services Starting!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Please wait 30-60 seconds for all services to start..." -ForegroundColor Yellow
Write-Host ""
Write-Host "Access Points:" -ForegroundColor Cyan
Write-Host "  Frontend:    http://localhost:4200" -ForegroundColor White
Write-Host "  Backend API: http://localhost:3000" -ForegroundColor White
Write-Host "  AI Services: http://localhost:5000" -ForegroundColor White
Write-Host ""
Write-Host "Default Login:" -ForegroundColor Cyan
Write-Host "  Email:    admin@inclusive-edu.com" -ForegroundColor White
Write-Host "  Password: admin123" -ForegroundColor White
Write-Host ""
Write-Host "Press any key to open the application in browser..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

Start-Sleep -Seconds 5
Start-Process "http://localhost:4200"

Write-Host ""
Write-Host "Application opened in browser!" -ForegroundColor Green
Write-Host "To stop all services, close the PowerShell windows or press Ctrl+C in each." -ForegroundColor Yellow
Write-Host ""
