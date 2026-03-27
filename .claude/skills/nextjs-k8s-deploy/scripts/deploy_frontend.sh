#!/usr/bin/env bash
# deploy_frontend.sh — Build and deploy LearnFlow Next.js frontend on K8s
# Usage: bash deploy_frontend.sh
# Pipe to verify: bash deploy_frontend.sh | python verify_frontend.py

set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TEMPLATES="$SCRIPT_DIR/templates"
NAMESPACE="learnflow"
IMAGE_NAME="learnflow-frontend:latest"

# --- Prerequisites ---
for cmd in kubectl docker; do
  if ! command -v $cmd &>/dev/null; then
    echo "{\"error\": \"$cmd not found in PATH\"}"; exit 1
  fi
done
if ! kubectl cluster-info &>/dev/null; then
  echo '{"error": "Cluster not reachable"}'; exit 1
fi

# Check backend services exist
if ! kubectl get deployment triage-agent -n "$NAMESPACE" &>/dev/null; then
  echo '{"error": "Backend services not deployed. Run fastapi-dapr-agent skill first"}'; exit 1
fi

# --- 1. Ensure namespace ---
kubectl create namespace "$NAMESPACE" --dry-run=client -o yaml 2>/dev/null | kubectl apply -f - >/dev/null 2>&1

# --- 1b. Create K8s secret from .env ---
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../../.." && pwd)"
ENV_FILE="$PROJECT_ROOT/.env"
if [ -f "$ENV_FILE" ]; then
  echo "Creating learnflow-secrets from .env..." >&2
  # Read values from .env
  DB_URL=$(grep '^DATABASE_URL=' "$ENV_FILE" | cut -d'=' -f2-)
  AUTH_SEC=$(grep '^AUTH_SECRET=' "$ENV_FILE" | cut -d'=' -f2-)
  OAI_KEY=$(grep '^OPENAI_API_KEY=' "$ENV_FILE" | cut -d'=' -f2-)
  kubectl create secret generic learnflow-secrets \
    --namespace="$NAMESPACE" \
    --from-literal="database-url=$DB_URL" \
    --from-literal="auth-secret=$AUTH_SEC" \
    --from-literal="openai-api-key=$OAI_KEY" \
    --dry-run=client -o yaml 2>/dev/null | kubectl apply -f - >/dev/null 2>&1
else
  echo "Warning: .env not found at $ENV_FILE, secrets not created" >&2
fi

# --- 2. Build Docker image in Minikube ---
echo "Building frontend image..." >&2
eval $(minikube docker-env 2>/dev/null) || {
  echo "Warning: Could not set minikube docker-env, using local Docker" >&2
}
docker build -t "$IMAGE_NAME" "$TEMPLATES/app" >/dev/null 2>&1 || {
  echo '{"error": "Docker build failed"}'; exit 1
}

# --- 3. Deploy to K8s ---
echo "Deploying frontend..." >&2
kubectl apply -f "$TEMPLATES/k8s/deployment.yaml" >/dev/null 2>&1

# --- 4. Wait for rollout ---
echo "Waiting for rollout..." >&2
kubectl rollout status deployment/learnflow-frontend -n "$NAMESPACE" --timeout=180s >/dev/null 2>&1 || {
  echo "Warning: Frontend rollout not yet complete" >&2
}

# --- 5. Output pod status JSON ---
kubectl get pods -n "$NAMESPACE" -l app=learnflow-frontend -o json 2>/dev/null || echo '{"items":[]}'
