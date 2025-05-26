#!/bin/bash

echo "=== Checking Kong Setup ==="

echo "1. Kong Services:"
kubectl get svc -n kong

echo -e "\n2. Kong Pods:"
kubectl get pods -n kong

echo -e "\n3. Frontend Service:"
kubectl get svc frontend

echo -e "\n4. Frontend Pods:"
kubectl get pods -l app=frontend

echo -e "\n5. All Ingress Rules:"
kubectl get ingress

echo -e "\n6. Frontend Ingress Details:"
kubectl describe ingress frontend-ingress

echo -e "\n7. Kong Ingress Class:"
kubectl get ingressclass
