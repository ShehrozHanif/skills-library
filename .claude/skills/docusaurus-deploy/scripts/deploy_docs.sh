#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TEMPLATE_DIR="$SCRIPT_DIR/templates/app"
NAMESPACE="learnflow"
IMAGE_NAME="learnflow-docs"
K8S_DIR="$SCRIPT_DIR/templates/k8s"

# Step 1: Prerequisites
echo "--- Step 1: Checking prerequisites ---"
for cmd in kubectl docker; do
  command -v "$cmd" >/dev/null 2>&1 || { echo "{\"error\": \"$cmd not found\"}"; exit 1; }
done

# Step 2: Create namespace (idempotent)
echo "--- Step 2: Creating namespace ---"
kubectl create namespace "$NAMESPACE" --dry-run=client -o yaml | kubectl apply -f -

# Step 3: Build Docker image in Minikube
echo "--- Step 3: Building Docker image ---"
if command -v minikube >/dev/null 2>&1; then
  eval $(minikube docker-env 2>/dev/null) || true
fi
docker build -t "$IMAGE_NAME:latest" "$TEMPLATE_DIR"

# Step 4: Apply K8s manifests
echo "--- Step 4: Deploying to Kubernetes ---"
kubectl apply -f "$K8S_DIR/deployment.yaml"

# Step 5: Wait for rollout
echo "--- Step 5: Waiting for rollout ---"
kubectl rollout status deployment/learnflow-docs -n "$NAMESPACE" --timeout=120s

# Step 6: Output status
echo "--- Output ---"
kubectl get pods -n "$NAMESPACE" -l app=learnflow-docs -o json | \
  python3 -c "
import json, sys
data = json.load(sys.stdin)
pods = data.get('items', [])
result = []
for p in pods:
    name = p['metadata']['name']
    phase = p['status'].get('phase', 'Unknown')
    containers = len(p['spec']['containers'])
    ready = sum(1 for c in p['status'].get('containerStatuses', []) if c.get('ready'))
    result.append({'name': name, 'phase': phase, 'containers': f'{ready}/{containers}'})
print(json.dumps(result))
"
