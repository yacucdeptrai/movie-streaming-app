#!/bin/bash

echo "=== Movie Streaming App Deployment Script ==="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if kubectl is available
if ! command -v kubectl &> /dev/null; then
    print_error "kubectl is not installed or not in PATH"
    exit 1
fi

# Check if docker is available
if ! command -v docker &> /dev/null; then
    print_error "docker is not installed or not in PATH"
    exit 1
fi

print_status "Building frontend Docker image..."
cd frontend
docker build -t movie-streaming-frontend:latest .
if [ $? -ne 0 ]; then
    print_error "Failed to build frontend image"
    exit 1
fi
cd ..

print_status "Applying Kubernetes configurations..."

# Apply secrets first
print_status "Applying secrets..."
kubectl apply -f contentvideo-secrets.yaml
kubectl apply -f streaming-secret.yaml

# Apply microservices
print_status "Deploying microservices..."
kubectl apply -f microservices/search-service/kubernetes/deployment.yaml
kubectl apply -f microservices/streaming-service/kubernetes/deployment.yaml
kubectl apply -f microservices/contentvideo-service/kubernetes/deployment.yaml

# Apply frontend
print_status "Deploying frontend..."
kubectl apply -f frontend/kubernetes/deployment.yaml

# Apply ingress rules
print_status "Applying ingress rules..."
kubectl apply -f infrastructure/kong/search-service-ingress.yaml
kubectl apply -f infrastructure/kong/streaming-service-ingress.yaml
kubectl apply -f infrastructure/kong/contentvideo-service-ingress.yaml
kubectl apply -f infrastructure/kong/frontend-ingress.yaml

print_status "Waiting for deployments to be ready..."
kubectl wait --for=condition=available --timeout=300s deployment/search-service
kubectl wait --for=condition=available --timeout=300s deployment/streaming-service
kubectl wait --for=condition=available --timeout=300s deployment/contentvideo-service
kubectl wait --for=condition=available --timeout=300s deployment/frontend

print_status "Checking deployment status..."
kubectl get pods
kubectl get services
kubectl get ingress

print_status "Deployment completed!"
print_warning "To access the application:"
print_warning "1. Run: kubectl port-forward svc/kong-kong-proxy 8080:80 -n kong"
print_warning "2. Open: http://localhost:8080"

print_status "To check logs:"
print_warning "kubectl logs -f deployment/frontend"
print_warning "kubectl logs -f deployment/search-service"
print_warning "kubectl logs -f deployment/streaming-service"
