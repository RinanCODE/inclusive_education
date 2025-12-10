#!/bin/sh
set -e

# Default API URL if not provided
API_URL=${API_URL:-http://localhost:3000/api}

echo "Setting API URL to: $API_URL"

# Replace API URL in the built JavaScript files
# Using sed with empty extension for Alpine Linux compatibility
find /usr/share/nginx/html -type f -name "*.js" -exec sed -i.bak "s|http://localhost:3000/api|$API_URL|g" {} \; 2>/dev/null || true
find /usr/share/nginx/html -type f -name "*.js" -exec sed -i.bak "s|https://your-production-api.com/api|$API_URL|g" {} \; 2>/dev/null || true
find /usr/share/nginx/html -type f -name "*.js.bak" -delete 2>/dev/null || true

# Replace API URL in main.js.map if it exists (for source maps)
find /usr/share/nginx/html -type f -name "*.map" -exec sed -i.bak "s|http://localhost:3000/api|$API_URL|g" {} \; 2>/dev/null || true
find /usr/share/nginx/html -type f -name "*.map" -exec sed -i.bak "s|https://your-production-api.com/api|$API_URL|g" {} \; 2>/dev/null || true
find /usr/share/nginx/html -type f -name "*.map.bak" -delete 2>/dev/null || true

echo "API URL configuration complete"

# Start nginx
exec nginx -g "daemon off;"

