#!/usr/bin/env bash
# deploy_services.sh — Install Dapr, build image, deploy 6 LearnFlow agents on K8s
# Usage: bash deploy_services.sh
# Pipe to verify: bash deploy_services.sh | python verify_services.py

set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TEMPLATES="$SCRIPT_DIR/templates"
NAMESPACE="learnflow"
IMAGE_NAME="learnflow-agent:latest"
# Load .env if present (for OpenAI key)
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../../.." && pwd)"
if [ -f "$PROJECT_ROOT/.env" ] && [ -z "${OPENAI_API_KEY:-}" ]; then
  OAI_FROM_ENV=$(grep '^OPENAI_API_KEY=' "$PROJECT_ROOT/.env" | cut -d'=' -f2-)
  OPENAI_API_KEY="${OAI_FROM_ENV:-mock}"
fi
OPENAI_API_KEY="${OPENAI_API_KEY:-mock}"

# --- Prerequisites ---
for cmd in kubectl helm; do
  if ! command -v $cmd &>/dev/null; then
    echo "{\"error\": \"$cmd not found in PATH\"}"; exit 1
  fi
done
if ! kubectl cluster-info &>/dev/null; then
  echo '{"error": "Cluster not reachable"}'; exit 1
fi
if ! kubectl get pod kafka-0 -n kafka &>/dev/null; then
  echo '{"error": "Kafka not deployed. Run kafka-k8s-setup first"}'; exit 1
fi
if ! kubectl get pods -n postgres -l app.kubernetes.io/name=postgresql &>/dev/null 2>&1; then
  echo '{"error": "PostgreSQL not deployed. Run postgres-k8s-setup first"}'; exit 1
fi

# --- 1. Install Dapr via Helm ---
helm repo add dapr https://dapr.github.io/helm-charts/ >/dev/null 2>&1 || true
helm repo update >/dev/null 2>&1

if ! helm list -n dapr-system 2>/dev/null | grep -q dapr; then
  echo "Installing Dapr..." >&2
  helm upgrade --install dapr dapr/dapr \
    --namespace dapr-system \
    --create-namespace \
    --set global.ha.enabled=false \
    --set dapr_dashboard.enabled=false \
    --set dapr_sidecar_injector.resources.requests.memory=64Mi \
    --set dapr_sidecar_injector.resources.limits.memory=128Mi \
    --set dapr_operator.resources.requests.memory=64Mi \
    --set dapr_operator.resources.limits.memory=128Mi \
    --set dapr_placement.resources.requests.memory=64Mi \
    --set dapr_placement.resources.limits.memory=128Mi \
    --set dapr_sentry.resources.requests.memory=64Mi \
    --set dapr_sentry.resources.limits.memory=128Mi \
    --wait --timeout 180s >/dev/null 2>&1 || {
    echo "Warning: Dapr install may not be fully ready" >&2
  }
else
  echo "Dapr already installed" >&2
fi

# --- 2. Create namespace ---
kubectl create namespace "$NAMESPACE" --dry-run=client -o yaml 2>/dev/null | kubectl apply -f - >/dev/null 2>&1

# --- 3. Create postgres credentials secret (references Phase 3 password) ---
kubectl create secret generic postgres-credentials \
  -n "$NAMESPACE" \
  --from-literal=connection-string="host=postgresql.postgres.svc.cluster.local user=postgres password=learnflow-dev port=5432 dbname=postgres sslmode=disable" \
  --dry-run=client -o yaml 2>/dev/null | kubectl apply -f - >/dev/null 2>&1

# --- 4. Apply Dapr components ---
kubectl apply -f "$TEMPLATES/dapr/kafka-pubsub.yaml" >/dev/null 2>&1
kubectl apply -f "$TEMPLATES/dapr/statestore.yaml" >/dev/null 2>&1

# --- 5. Create responses Kafka topic ---
kubectl exec kafka-0 -n kafka -- \
  sh -c "/opt/kafka/bin/kafka-topics.sh --create \
  --topic responses \
  --bootstrap-server localhost:9092 \
  --partitions 1 \
  --replication-factor 1 \
  --if-not-exists" >/dev/null 2>&1 || true

# --- 6. Build Docker image in Minikube ---
echo "Building container image..." >&2
eval $(minikube docker-env 2>/dev/null) || {
  echo "Warning: Could not set minikube docker-env, using local Docker" >&2
}
docker build -t "$IMAGE_NAME" "$TEMPLATES/app" >/dev/null 2>&1 || {
  echo '{"error": "Docker build failed"}'; exit 1
}

# --- 7. Deploy 6 agents ---
declare -A AGENT_TOPICS=(
  [triage]="learning,code,exercise,struggle"
  [concepts]="learning"
  [codereview]="code"
  [debug]="code"
  [exercise]="exercise"
  [progress]="struggle,responses"
)

for AGENT_NAME in triage concepts codereview debug exercise progress; do
  SUBSCRIBE_TOPIC="${AGENT_TOPICS[$AGENT_NAME]}"
  export AGENT_NAME SUBSCRIBE_TOPIC OPENAI_API_KEY
  envsubst < "$TEMPLATES/k8s/deployment.yaml.tmpl" | kubectl apply -f - >/dev/null 2>&1
  echo "Deployed $AGENT_NAME-agent (topics: $SUBSCRIBE_TOPIC)" >&2
done

# --- 8. Wait for rollouts ---
echo "Waiting for rollouts..." >&2
for AGENT_NAME in triage concepts codereview debug exercise progress; do
  kubectl rollout status deployment/${AGENT_NAME}-agent -n "$NAMESPACE" --timeout=300s >/dev/null 2>&1 || {
    echo "Warning: ${AGENT_NAME}-agent rollout not complete" >&2
  }
done

# --- 9. Output pod status JSON ---
kubectl get pods -n "$NAMESPACE" -o json 2>/dev/null || echo '{"items":[]}'
