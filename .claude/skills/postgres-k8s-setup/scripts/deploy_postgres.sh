#!/usr/bin/env bash
# deploy_postgres.sh — Deploy PostgreSQL on K8s via Bitnami Helm chart
# Usage: bash deploy_postgres.sh
# Pipe to verify: bash deploy_postgres.sh | python verify_postgres.py

set -uo pipefail

# Check prerequisites
if ! command -v helm &>/dev/null; then
  echo '{"error": "helm not found in PATH"}'; exit 1
fi
if ! command -v kubectl &>/dev/null; then
  echo '{"error": "kubectl not found in PATH"}'; exit 1
fi
if ! kubectl cluster-info &>/dev/null; then
  echo '{"error": "Cluster not reachable"}'; exit 1
fi

# Add Bitnami repo (idempotent)
helm repo add bitnami https://charts.bitnami.com/bitnami >/dev/null 2>&1 || true
helm repo update >/dev/null 2>&1

# Deploy PostgreSQL with dev credentials, small resources
HELM_OUTPUT=$(helm upgrade --install postgresql bitnami/postgresql \
  --namespace postgres \
  --create-namespace \
  --set auth.postgresPassword=learnflow-dev \
  --set primary.resourcePreset=small \
  --wait \
  --timeout 180s 2>&1) || {
  echo "Helm warning: $HELM_OUTPUT" >&2
}

# Output pod status JSON for verify_postgres.py
kubectl get pods -n postgres -o json 2>/dev/null || echo '{"items":[]}'
