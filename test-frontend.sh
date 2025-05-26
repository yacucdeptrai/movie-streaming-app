#!/bin/bash

echo "=== Frontend Testing Script ==="

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
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

# Test 1: Check if frontend pod is running
print_status "Testing frontend deployment..."

if kubectl get pods -l app=frontend | grep -q "Running"; then
    print_status "✓ Frontend pod is running"
else
    print_error "✗ Frontend pod is not running"
    kubectl get pods -l app=frontend
    exit 1
fi

# Test 2: Check frontend service
print_status "Testing frontend service..."

if kubectl get svc frontend &> /dev/null; then
    print_status "✓ Frontend service exists"
else
    print_error "✗ Frontend service not found"
    exit 1
fi

# Test 3: Check ingress
print_status "Testing frontend ingress..."

if kubectl get ingress frontend-ingress &> /dev/null; then
    print_status "✓ Frontend ingress exists"
else
    print_error "✗ Frontend ingress not found"
    exit 1
fi

# Test 4: Check Kong proxy
print_status "Testing Kong proxy..."

if kubectl get svc kong-kong-proxy -n kong &> /dev/null; then
    print_status "✓ Kong proxy service exists"
else
    print_error "✗ Kong proxy service not found"
    print_warning "Install Kong with: kubectl apply -f https://bit.ly/k4k8s"
    exit 1
fi

# Test 5: Check frontend logs for errors
print_status "Checking frontend logs for errors..."

ERROR_COUNT=$(kubectl logs -l app=frontend --tail=50 | grep -i error | wc -l)
if [ $ERROR_COUNT -eq 0 ]; then
    print_status "✓ No errors found in frontend logs"
else
    print_warning "⚠ Found $ERROR_COUNT errors in frontend logs:"
    kubectl logs -l app=frontend --tail=10 | grep -i error
fi

# Test 6: Test port forwarding
print_status "Testing port forwarding setup..."

print_warning "To test the frontend:"
echo "1. Run: kubectl port-forward svc/kong-kong-proxy 8080:80 -n kong"
echo "2. Open: http://localhost:8080"
echo "3. Check browser console for any JavaScript errors"

# Test 7: Show detailed pod information
print_status "Frontend pod details:"
kubectl describe pods -l app=frontend

print_status "Frontend testing completed!"
