#!/bin/bash

echo "=== Movie Streaming App Status Check ==="

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "\n${GREEN}1. Checking Kong Status:${NC}"
kubectl get pods -n kong
kubectl get svc -n kong

echo -e "\n${GREEN}2. Checking Application Pods:${NC}"
kubectl get pods -l app=frontend
kubectl get pods -l app=search-service
kubectl get pods -l app=streaming-service
kubectl get pods -l app=contentvideo-service

echo -e "\n${GREEN}3. Checking Services:${NC}"
kubectl get svc

echo -e "\n${GREEN}4. Checking Ingress:${NC}"
kubectl get ingress

echo -e "\n${GREEN}5. Checking Pod Logs (last 10 lines):${NC}"
echo -e "\n${YELLOW}Frontend logs:${NC}"
kubectl logs --tail=10 -l app=frontend

echo -e "\n${YELLOW}Search Service logs:${NC}"
kubectl logs --tail=10 -l app=search-service

echo -e "\n${YELLOW}Streaming Service logs:${NC}"
kubectl logs --tail=10 -l app=streaming-service

echo -e "\n${GREEN}6. Testing Kong Proxy:${NC}"
echo "Kong proxy should be accessible at: http://localhost:8080"
echo "Run this command to forward port: kubectl port-forward svc/kong-kong-proxy 8080:80 -n kong"

echo -e "\n${GREEN}7. Testing API endpoints:${NC}"
echo "After port-forward, test these URLs:"
echo "- Frontend: http://localhost:8080"
echo "- Search API: http://localhost:8080/api/search"
echo "- Health check: http://localhost:8080/health"
