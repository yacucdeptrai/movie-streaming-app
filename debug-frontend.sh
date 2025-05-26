#!/bin/bash

echo "=== Frontend Debug Script ==="

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_debug() {
    echo -e "${BLUE}[DEBUG]${NC} $1"
}

# Debug 1: Check Docker image
print_debug "Checking Docker image..."
if docker images | grep -q "movie-streaming-frontend"; then
    print_status "✓ Frontend Docker image exists"
    docker images | grep movie-streaming-frontend
else
    print_error "✗ Frontend Docker image not found"
    print_warning "Build with: cd frontend && docker build -t movie-streaming-frontend:latest ."
fi

# Debug 2: Check build files
print_debug "Checking build files..."
if [ -d "frontend/dist" ]; then
    print_status "✓ Frontend dist directory exists"
    echo "Files in dist:"
    ls -la frontend/dist/
else
    print_error "✗ Frontend dist directory not found"
    print_warning "Build with: cd frontend && npm run build"
fi

# Debug 3: Check nginx config in container
print_debug "Checking nginx configuration in container..."
POD_NAME=$(kubectl get pods -l app=frontend -o jsonpath='{.items[0].metadata.name}')
if [ ! -z "$POD_NAME" ]; then
    print_status "Frontend pod: $POD_NAME"
    
    print_debug "Nginx configuration:"
    kubectl exec $POD_NAME -- cat /etc/nginx/nginx.conf | head -20
    
    print_debug "Files in nginx html directory:"
    kubectl exec $POD_NAME -- ls -la /usr/share/nginx/html/
    
    print_debug "Nginx process status:"
    kubectl exec $POD_NAME -- ps aux | grep nginx
else
    print_error "No frontend pod found"
fi

# Debug 4: Check service endpoints
print_debug "Checking service endpoints..."
kubectl get endpoints frontend

# Debug 5: Check ingress details
print_debug "Checking ingress details..."
kubectl describe ingress frontend-ingress

# Debug 6: Test internal connectivity
print_debug "Testing internal connectivity..."
if [ ! -z "$POD_NAME" ]; then
    print_debug "Testing nginx health check:"
    kubectl exec $POD_NAME -- wget -qO- http://localhost/health || print_error "Health check failed"
    
    print_debug "Testing index.html:"
    kubectl exec $POD_NAME -- wget -qO- http://localhost/ | head -10 || print_error "Index.html not accessible"
fi

# Debug 7: Show recent logs
print_debug "Recent frontend logs:"
kubectl logs -l app=frontend --tail=20

print_status "Debug completed!"
