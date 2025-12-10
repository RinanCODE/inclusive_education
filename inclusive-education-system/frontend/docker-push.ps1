# Script to build and push Angular frontend to Docker Hub
# Make sure Docker Desktop is running before executing this script

param(
    [Parameter(Mandatory=$true)]
    [string]$DockerHubUsername,
    
    [Parameter(Mandatory=$false)]
    [string]$ImageTag = "latest"
)

$ErrorActionPreference = "Stop"

Write-Host "Building Docker image..." -ForegroundColor Green
docker build -t inclusive-education-frontend:$ImageTag .

if ($LASTEXITCODE -ne 0) {
    Write-Host "Build failed!" -ForegroundColor Red
    exit 1
}

Write-Host "Tagging image for Docker Hub..." -ForegroundColor Green
docker tag inclusive-education-frontend:$ImageTag "$DockerHubUsername/inclusive-education-frontend:$ImageTag"

Write-Host "Logging into Docker Hub..." -ForegroundColor Yellow
Write-Host "Please enter your Docker Hub credentials when prompted."
docker login

if ($LASTEXITCODE -ne 0) {
    Write-Host "Docker Hub login failed!" -ForegroundColor Red
    exit 1
}

Write-Host "Pushing image to Docker Hub..." -ForegroundColor Green
docker push "$DockerHubUsername/inclusive-education-frontend:$ImageTag"

if ($LASTEXITCODE -eq 0) {
    Write-Host "`nSuccess! Your image is available at:" -ForegroundColor Green
    Write-Host "docker pull $DockerHubUsername/inclusive-education-frontend:$ImageTag" -ForegroundColor Cyan
    Write-Host "`nTo run the container:" -ForegroundColor Yellow
    Write-Host "docker run -p 8080:80 $DockerHubUsername/inclusive-education-frontend:$ImageTag" -ForegroundColor Cyan
} else {
    Write-Host "Push failed!" -ForegroundColor Red
    exit 1
}

