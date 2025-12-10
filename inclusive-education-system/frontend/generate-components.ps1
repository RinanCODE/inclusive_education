# PowerShell script to generate all Angular components
# Run this after installing dependencies: npm install

Write-Host "Generating Angular Components..." -ForegroundColor Green

# Auth components
ng generate component components/auth/login --skip-tests
ng generate component components/auth/register --skip-tests

# Dashboard components
ng generate component components/dashboard --skip-tests
ng generate component components/student/student-dashboard --skip-tests

# Feature components
ng generate component components/chatbot --skip-tests
ng generate component components/messages --skip-tests
ng generate component components/study-groups --skip-tests

# Admin components
ng generate component components/admin/admin-dashboard --skip-tests
ng generate component components/admin/admin-users --skip-tests
ng generate component components/admin/admin-courses --skip-tests

# Shared components
ng generate component components/shared/navbar --skip-tests
ng generate component components/shared/sidebar --skip-tests
ng generate component components/shared/accessibility-toolbar --skip-tests

Write-Host "All components generated successfully!" -ForegroundColor Green
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Implement component logic based on SETUP_GUIDE.md" -ForegroundColor White
Write-Host "2. Add component templates and styles" -ForegroundColor White
Write-Host "3. Test the application" -ForegroundColor White
