#!/usr/bin/env bash
# check_cluster.sh — Checks K8s cluster health, outputs JSON for verify_health.py
# Usage: bash check_cluster.sh | python verify_health.py
# On failure: prints "Cluster not reachable" and exits 1

set -euo pipefail

# Check kubectl is available
if ! command -v kubectl &>/dev/null; then
  echo '{"error": "kubectl not found in PATH"}'
  exit 1
fi

# Check cluster reachability
if ! kubectl cluster-info &>/dev/null; then
  echo '{"error": "Cluster not reachable"}'
  exit 1
fi

# Collect node status
NODES_JSON=$(kubectl get nodes -o json 2>/dev/null || echo '{"items":[]}')

# Collect core pods (kube-system namespace)
PODS_JSON=$(kubectl get pods -n kube-system -o json 2>/dev/null || echo '{"items":[]}')

# Output combined JSON
cat <<EOF
{
  "nodes": $NODES_JSON,
  "pods": $PODS_JSON
}
EOF
