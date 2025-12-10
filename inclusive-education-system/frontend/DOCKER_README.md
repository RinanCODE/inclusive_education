# Docker Hub Deployment Guide

This guide explains how to build and push the Angular frontend application to Docker Hub so others can pull and run it.

## Prerequisites

1. **Docker Desktop** must be installed and running
2. A **Docker Hub account** (create one at https://hub.docker.com if needed)

## Quick Start

### Option 1: Use the PowerShell Script (Recommended)

1. Start Docker Desktop and wait for it to be ready
2. Open PowerShell in this directory
3. Run the script:
   ```powershell
   .\docker-push.ps1 -DockerHubUsername your-dockerhub-username
   ```
4. Enter your Docker Hub credentials when prompted
5. The script will build, tag, and push the image automatically

### Option 2: Manual Steps

1. **Start Docker Desktop** and wait for it to be ready

2. **Build the Docker image:**
   ```powershell
   docker build -t inclusive-education-frontend:latest .
   ```

3. **Tag the image with your Docker Hub username:**
   ```powershell
   docker tag inclusive-education-frontend:latest your-username/inclusive-education-frontend:latest
   ```

4. **Login to Docker Hub:**
   ```powershell
   docker login
   ```
   Enter your Docker Hub username and password when prompted.

5. **Push the image to Docker Hub:**
   ```powershell
   docker push your-username/inclusive-education-frontend:latest
   ```

## Sharing with Others

Once pushed, others can pull and run your image:

```powershell
# Pull the image
docker pull your-username/inclusive-education-frontend:latest

# Run the container
docker run -d -p 8080:80 your-username/inclusive-education-frontend:latest
```

The application will be available at `http://localhost:8080`

## Docker Image Details

- **Base Image**: nginx:alpine (lightweight web server)
- **Build**: Multi-stage build (Node.js for building, nginx for serving)
- **Port**: 80 (mapped to host port as needed)
- **Output**: Production build of Angular app served via nginx

## Troubleshooting

- **"Docker daemon is not running"**: Start Docker Desktop
- **"Access denied"**: Make sure you're logged in to Docker Hub (`docker login`)
- **Build fails**: Check that all dependencies in `package.json` are valid

