# Script to build and push all services to Docker Hub
# Make sure Docker Desktop is running before executing this script

param(
    [Parameter(Mandatory=$true)]
    [string]$DockerHubUsername,
    
    [Parameter(Mandatory=$false)]
    [string]$ImageTag = "latest"
)

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Building and Pushing All Services" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$services = @(
    @{Name="ai-services"; Path="ai-services"; Image="inclusive-education-ai"},
    @{Name="backend"; Path="backend"; Image="inclusive-education-backend"},
    @{Name="frontend"; Path="frontend"; Image="inclusive-education-frontend"}
)

foreach ($service in $services) {
    Write-Host "Processing: $($service.Name)" -ForegroundColor Green
    Write-Host "----------------------------------------" -ForegroundColor Gray
    
    $servicePath = Join-Path $PSScriptRoot $service.Path
    $imageName = $service.Image
    $fullImageName = "$DockerHubUsername/$imageName"
    
    # Build
    Write-Host "Building Docker image..." -ForegroundColor Yellow
    docker build -t "$imageName`:$ImageTag" $servicePath
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Build failed for $($service.Name)!" -ForegroundColor Red
        exit 1
    }
    
    # Tag
    Write-Host "Tagging image for Docker Hub..." -ForegroundColor Yellow
    docker tag "$imageName`:$ImageTag" "$fullImageName`:$ImageTag"
    
    Write-Host "✅ $($service.Name) ready for push" -ForegroundColor Green
    Write-Host ""
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Logging into Docker Hub..." -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Please enter your Docker Hub credentials when prompted." -ForegroundColor Yellow
docker login

if ($LASTEXITCODE -ne 0) {
    Write-Host "Docker Hub login failed!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Pushing images to Docker Hub..." -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

foreach ($service in $services) {
    $imageName = $service.Image
    $fullImageName = "$DockerHubUsername/$imageName"
    
    Write-Host "Pushing $($service.Name)..." -ForegroundColor Yellow
    docker push "$fullImageName`:$ImageTag"
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Push failed for $($service.Name)!" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "✅ $($service.Name) pushed successfully" -ForegroundColor Green
    Write-Host ""
}

Write-Host "========================================" -ForegroundColor Green
Write-Host "Success! All images pushed to Docker Hub" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Images available at:" -ForegroundColor Cyan
foreach ($service in $services) {
    $fullImageName = "$DockerHubUsername/$($service.Image)"
    Write-Host "  - $fullImageName`:$ImageTag" -ForegroundColor White
}
Write-Host ""
Write-Host "To pull and run the complete stack, use:" -ForegroundColor Yellow
Write-Host "  docker pull $DockerHubUsername/inclusive-education-ai:$ImageTag" -ForegroundColor White
Write-Host "  docker pull $DockerHubUsername/inclusive-education-backend:$ImageTag" -ForegroundColor White
Write-Host "  docker pull $DockerHubUsername/inclusive-education-frontend:$ImageTag" -ForegroundColor White
Write-Host ""
Write-Host "Or use docker-compose with the updated image names in docker-compose.yml" -ForegroundColor Yellow

