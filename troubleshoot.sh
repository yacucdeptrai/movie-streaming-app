#!/bin/bash

echo "=== Troubleshooting Script ==="

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}Checking common issues...${NC}\n"

# Check if Kong is running
echo -e "${YELLOW}1. Checking Kong installation:${NC}"
if kubectl get namespace kong &> /dev/null; then
    echo "✓ Kong namespace exists"
    if kubectl get pods -n kong | grep -q "Running"; then
        echo "✓ Kong pods are running"
    else
        echo "✗ Kong pods are not running"
        kubectl get pods -n kong
    fi
else
    echo "✗ Kong namespace not found"
    echo "Install Kong with: kubectl apply -f https://bit.ly/k4k8s"
fi

# Check if images exist
echo -e "\n${YELLOW}2. Checking Docker images:${NC}"
if docker images | grep -q "movie-streaming-frontend"; then
    echo "✓ Frontend image exists"
else
    echo "✗ Frontend image not found"
    echo "Build with: cd frontend && docker build -t movie-streaming-frontend:latest ."
fi

# Check if pods are running
echo -e "\n${YELLOW}3. Checking pod status:${NC}"
kubectl get pods --field-selector=status.phase!=Running

# Check if services are accessible
echo -e "\n${YELLOW}4. Checking service endpoints:${NC}"
kubectl get endpoints

# Check ingress
echo -e "\n${YELLOW}5. Checking ingress configuration:${NC}"
kubectl describe ingress frontend-ingress

# Check logs for errors
echo -e "\n${YELLOW}6. Checking for errors in logs:${NC}"
echo "Frontend errors:"
kubectl logs -l app=frontend --tail=5 | grep -i error || echo "No errors found"

echo -e "\n${GREEN}Quick fixes:${NC}"
echo "1. Restart deployments: kubectl rollout restart deployment/frontend"
echo "2. Delete and recreate: kubectl delete pod -l app=frontend"
echo "3. Check port-forward: kubectl port-forward svc/kong-kong-proxy 8080:80 -n kong"
echo "4. Rebuild frontend: cd frontend && docker build -t movie-streaming-frontend:latest . --no-cache"
