#!/usr/bin/env bash
# test_routing.sh — Test triage agent routing via port-forward
# Usage: bash test_routing.sh
# Pipe to verify: bash test_routing.sh | python verify_routing.py

set -uo pipefail

NAMESPACE="learnflow"

if ! command -v kubectl &>/dev/null; then
  echo '{"error": "kubectl not found in PATH"}'; exit 1
fi

# Check triage agent is running
if ! kubectl get deployment triage-agent -n "$NAMESPACE" &>/dev/null; then
  echo '{"error": "triage-agent not deployed in learnflow namespace"}'; exit 1
fi

# Port-forward triage agent (background, killed on exit)
kubectl port-forward -n "$NAMESPACE" svc/triage-agent 18080:80 &>/dev/null &
PF_PID=$!
trap "kill $PF_PID 2>/dev/null" EXIT
sleep 3

RESULTS="["
FIRST=true

# Test cases: message → expected topic
declare -A TESTS=(
  ["What is a list in Python?"]="learning"
  ["Please review my code"]="code"
  ["Give me a practice exercise"]="exercise"
  ["I don't understand anything, I'm stuck"]="struggle"
)

for MSG in "${!TESTS[@]}"; do
  EXPECTED="${TESTS[$MSG]}"

  RESPONSE=$(curl -s -X POST http://localhost:18080/chat \
    -H "Content-Type: application/json" \
    -d "{\"message\": \"$MSG\", \"user_id\": \"test-user\"}" 2>/dev/null) || RESPONSE='{"error":"curl failed"}'

  ACTUAL_TOPIC=$(echo "$RESPONSE" | python3 -c "import sys,json; print(json.load(sys.stdin).get('topic','unknown'))" 2>/dev/null) || ACTUAL_TOPIC="error"
  STATUS=$(echo "$RESPONSE" | python3 -c "import sys,json; print(json.load(sys.stdin).get('status','unknown'))" 2>/dev/null) || STATUS="error"

  MATCH="false"
  if [ "$ACTUAL_TOPIC" = "$EXPECTED" ]; then
    MATCH="true"
  fi

  if [ "$FIRST" = true ]; then
    FIRST=false
  else
    RESULTS+=","
  fi
  RESULTS+="{\"message\":\"$MSG\",\"expected\":\"$EXPECTED\",\"actual\":\"$ACTUAL_TOPIC\",\"status\":\"$STATUS\",\"match\":$MATCH}"
done

RESULTS+="]"
echo "$RESULTS"
