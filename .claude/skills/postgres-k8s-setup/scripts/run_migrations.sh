#!/usr/bin/env bash
# run_migrations.sh — Run SQL migrations against PostgreSQL on K8s
# Usage: bash run_migrations.sh [migrations_dir]
# Pipe to verify: bash run_migrations.sh | python verify_schema.py

set -uo pipefail

MIGRATIONS_DIR="${1:-$(dirname "$0")/migrations}"

if ! command -v kubectl &>/dev/null; then
  echo '{"error": "kubectl not found in PATH"}'; exit 1
fi
if ! kubectl cluster-info &>/dev/null; then
  echo '{"error": "Cluster not reachable"}'; exit 1
fi
if ! kubectl get pod postgresql-0 -n postgres &>/dev/null; then
  echo '{"error": "PostgreSQL pod not found in postgres namespace"}'; exit 1
fi

if [ ! -d "$MIGRATIONS_DIR" ]; then
  echo "{\"error\": \"Migrations directory not found: $MIGRATIONS_DIR\"}"; exit 1
fi

SQL_FILES=$(find "$MIGRATIONS_DIR" -name '*.sql' -type f | sort)
if [ -z "$SQL_FILES" ]; then
  echo '{"error": "No .sql files found in migrations directory"}'; exit 1
fi

RESULTS="["
FIRST=true

for SQL_FILE in $SQL_FILES; do
  FILENAME=$(basename "$SQL_FILE")
  SQL_CONTENT=$(cat "$SQL_FILE")

  OUTPUT=$(kubectl exec -i postgresql-0 -n postgres -- \
    env PGPASSWORD=learnflow-dev psql -U postgres -d postgres -f - <<< "$SQL_CONTENT" 2>&1) || true

  STATUS="applied"
  if echo "$OUTPUT" | grep -qi "error\|fatal"; then
    STATUS="failed"
  fi

  if [ "$FIRST" = true ]; then
    FIRST=false
  else
    RESULTS+=","
  fi
  RESULTS+="{\"file\":\"$FILENAME\",\"status\":\"$STATUS\"}"
done

RESULTS+="]"
echo "$RESULTS"
