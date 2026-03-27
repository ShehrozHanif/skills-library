#!/usr/bin/env bash
# create_topics.sh — Create Kafka topics on K8s cluster
# Usage: bash create_topics.sh <topic1> <topic2> ...
# Pipe to verify: bash create_topics.sh <topics> | python verify_topics.py

set -uo pipefail

if [ $# -eq 0 ]; then
  echo '{"error": "No topics specified. Usage: bash create_topics.sh <topic1> <topic2> ..."}'; exit 1
fi

if ! command -v kubectl &>/dev/null; then
  echo '{"error": "kubectl not found in PATH"}'; exit 1
fi
if ! kubectl cluster-info &>/dev/null; then
  echo '{"error": "Cluster not reachable"}'; exit 1
fi

# Verify Kafka pod is running
if ! kubectl get pod kafka-0 -n kafka &>/dev/null; then
  echo '{"error": "Kafka pod kafka-0 not found in kafka namespace"}'; exit 1
fi

RESULTS="["
FIRST=true

for TOPIC in "$@"; do
  # Create topic (idempotent with --if-not-exists)
  # Use sh -c wrapper to prevent MSYS path conversion on Windows
  OUTPUT=$(kubectl exec kafka-0 -n kafka -- \
    sh -c "/opt/kafka/bin/kafka-topics.sh --create \
    --topic $TOPIC \
    --bootstrap-server localhost:9092 \
    --partitions 1 \
    --replication-factor 1 \
    --if-not-exists" 2>&1) || true

  STATUS="created"
  if echo "$OUTPUT" | grep -qi "already exists"; then
    STATUS="exists"
  elif echo "$OUTPUT" | grep -qi "error\|exception"; then
    STATUS="failed"
  fi

  if [ "$FIRST" = true ]; then
    FIRST=false
  else
    RESULTS+=","
  fi
  RESULTS+="{\"topic\":\"$TOPIC\",\"status\":\"$STATUS\"}"
done

RESULTS+="]"
echo "$RESULTS"
