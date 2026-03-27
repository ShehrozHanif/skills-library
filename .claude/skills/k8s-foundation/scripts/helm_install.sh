#!/usr/bin/env bash
# helm_install.sh — Install a Helm chart with idempotency and pod verification
# Usage: bash helm_install.sh <chart-name> <namespace> [--repo <repo-url>]
# Example: bash helm_install.sh nginx default --repo https://charts.bitnami.com/bitnami

set -euo pipefail

# --- Argument Parsing ---
if [ $# -lt 2 ]; then
  echo "Usage: helm_install.sh <chart-name> <namespace> [--repo <repo-url>]"
  exit 1
fi

CHART_NAME="$1"
NAMESPACE="$2"
REPO_URL=""
REPO_NAME=""

# Parse optional --repo flag
shift 2
while [[ $# -gt 0 ]]; do
  case "$1" in
    --repo)
      REPO_URL="$2"
      shift 2
      ;;
    *)
      echo "Unknown argument: $1"
      exit 1
      ;;
  esac
done

# Check helm is available
if ! command -v helm &>/dev/null; then
  echo "Error: helm not found in PATH"
  exit 1
fi

# Check kubectl is available
if ! command -v kubectl &>/dev/null; then
  echo "Error: kubectl not found in PATH"
  exit 1
fi

# --- Add Helm Repo (if --repo provided) ---
if [ -n "$REPO_URL" ]; then
  # Extract repo name from chart (e.g., "bitnami/nginx" -> "bitnami")
  if [[ "$CHART_NAME" == */* ]]; then
    REPO_NAME="${CHART_NAME%%/*}"
  else
    REPO_NAME="$CHART_NAME"
  fi

  # Add repo if not already present
  if ! helm repo list 2>/dev/null | grep -q "^${REPO_NAME}"; then
    helm repo add "$REPO_NAME" "$REPO_URL" &>/dev/null
    helm repo update &>/dev/null
  fi
fi

# --- Install/Upgrade Chart (Idempotent) ---
RELEASE_NAME="${CHART_NAME##*/}"  # Use chart name as release name

helm upgrade --install "$RELEASE_NAME" "$CHART_NAME" \
  --namespace "$NAMESPACE" \
  --create-namespace \
  --wait \
  --timeout 120s \
  &>/dev/null

# --- Verify Pods ---
TOTAL_PODS=$(kubectl get pods -n "$NAMESPACE" -l "app.kubernetes.io/instance=$RELEASE_NAME" -o json 2>/dev/null | python3 -c "
import sys, json
data = json.load(sys.stdin)
items = data.get('items', [])
total = len(items)
running = sum(1 for p in items if p.get('status',{}).get('phase') == 'Running')
print(f'{running}/{total}')
" 2>/dev/null || echo "?/?")

echo "$RELEASE_NAME deployed: $TOTAL_PODS pods Running in $NAMESPACE"
