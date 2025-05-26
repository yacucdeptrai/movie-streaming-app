#!/bin/bash

echo "=== Clean Rebuild Script for Movie Streaming App ==="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# Check prerequisites
print_step "Checking prerequisites..."

if ! command -v kubectl &> /dev/null; then
    print_error "kubectl is not installed"
    exit 1
fi

if ! command -v docker &> /dev/null; then
    print_error "docker is not installed"
    exit 1
fi

if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed"
    exit 1
fi

print_status "All prerequisites found"

# Step 1: Clean up existing resources
print_step "Step 1: Cleaning up existing resources..."

print_status "Deleting existing deployments..."
kubectl delete deployment frontend --ignore-not-found=true
kubectl delete deployment search-service --ignore-not-found=true
kubectl delete deployment streaming-service --ignore-not-found=true
kubectl delete deployment contentvideo-service --ignore-not-found=true

print_status "Deleting existing services..."
kubectl delete service frontend --ignore-not-found=true
kubectl delete service search-service --ignore-not-found=true
kubectl delete service streaming-service --ignore-not-found=true
kubectl delete service contentvideo-service --ignore-not-found=true

print_status "Deleting existing ingress..."
kubectl delete ingress frontend-ingress --ignore-not-found=true
kubectl delete ingress search-service-ingress --ignore-not-found=true
kubectl delete ingress streaming-service-ingress --ignore-not-found=true
kubectl delete ingress contentvideo-service-ingress --ignore-not-found=true

print_status "Cleaning up Docker images..."
docker rmi movie-streaming-frontend:latest --force 2>/dev/null || true
docker system prune -f

# Step 2: Install Kong if not exists
print_step "Step 2: Checking Kong installation..."

if ! kubectl get namespace kong &> /dev/null; then
    print_status "Installing Kong..."
    kubectl apply -f https://bit.ly/k4k8s
    print_status "Waiting for Kong to be ready..."
    kubectl wait --namespace kong --for=condition=ready pod --selector=app=kong --timeout=300s
else
    print_status "Kong already installed"
fi

# Step 3: Rebuild frontend
print_step "Step 3: Rebuilding frontend..."

cd frontend

print_status "Installing npm dependencies..."
npm install

print_status "Building frontend application..."
npm run build

if [ $? -ne 0 ]; then
    print_error "Frontend build failed"
    exit 1
fi

print_status "Building Docker image..."
docker build -t movie-streaming-frontend:latest . --no-cache

if [ $? -ne 0 ]; then
    print_error "Docker build failed"
    exit 1
fi

cd ..

# Step 4: Apply secrets
print_step "Step 4: Applying secrets..."
kubectl apply -f contentvideo-secrets.yaml
kubectl apply -f streaming-secret.yaml

# Step 5: Deploy microservices
print_step "Step 5: Deploying microservices..."

print_status "Deploying search service..."
kubectl apply -f microservices/search-service/kubernetes/deployment.yaml

print_status "Deploying streaming service..."
kubectl apply -f microservices/streaming-service/kubernetes/deployment.yaml

print_status "Deploying contentvideo service..."
kubectl apply -f microservices/contentvideo-service/kubernetes/deployment.yaml

# Step 6: Deploy frontend
print_step "Step 6: Deploying frontend..."
kubectl apply -f frontend/kubernetes/deployment.yaml

# Step 7: Apply ingress rules
print_step "Step 7: Applying ingress rules..."
kubectl apply -f infrastructure/kong/search-service-ingress.yaml
kubectl apply -f infrastructure/kong/streaming-service-ingress.yaml
kubectl apply -f infrastructure/kong/contentvideo-service-ingress.yaml
kubectl apply -f infrastructure/kong/frontend-ingress.yaml

# Step 8: Wait for deployments
print_step "Step 8: Waiting for deployments to be ready..."

print_status "Waiting for search service..."
kubectl wait --for=condition=available --timeout=300s deployment/search-service

print_status "Waiting for streaming service..."
kubectl wait --for=condition=available --timeout=300s deployment/streaming-service

print_status "Waiting for contentvideo service..."
kubectl wait --for=condition=available --timeout=300s deployment/contentvideo-service

print_status "Waiting for frontend..."
kubectl wait --for=condition=available --timeout=300s deployment/frontend

# Step 9: Verify deployment
print_step "Step 9: Verifying deployment..."

echo -e "\n${GREEN}=== DEPLOYMENT STATUS ===${NC}"
kubectl get pods
echo ""
kubectl get services
echo ""
kubectl get ingress

# Step 10: Test connectivity
print_step "Step 10: Testing connectivity..."

print_status "Checking if Kong proxy is accessible..."
if kubectl get svc kong-kong-proxy -n kong &> /dev/null; then
    print_status "Kong proxy service found"
else
    print_error "Kong proxy service not found"
    exit 1
fi

# Final instructions
echo -e "\n${GREEN}=== DEPLOYMENT COMPLETED SUCCESSFULLY ===${NC}"
echo ""
print_warning "To access the application:"
echo "1. Run: kubectl port-forward svc/kong-kong-proxy 8080:80 -n kong"
echo "2. Open: http://localhost:8080"
echo ""
print_warning "To check logs:"
echo "kubectl logs -f deployment/frontend"
echo "kubectl logs -f deployment/search-service"
echo "kubectl logs -f deployment/streaming-service"
echo ""
print_warning "To troubleshoot:"
echo "./troubleshoot.sh"

print_status "Clean rebuild completed!"
