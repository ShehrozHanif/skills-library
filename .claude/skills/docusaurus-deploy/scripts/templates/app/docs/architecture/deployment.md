---
sidebar_position: 2
---

# Deployment Guide

## Deployment Order

Skills must be deployed in order due to dependencies:

```
1. kafka-k8s-setup        → Kafka in kafka namespace
2. postgres-k8s-setup     → PostgreSQL in postgres namespace
3. fastapi-dapr-agent     → 6 agents + Dapr in learnflow namespace
4. nextjs-k8s-deploy      → Frontend in learnflow namespace
5. docusaurus-deploy       → Docs in learnflow namespace
```

## Namespaces

| Namespace | Services |
|-----------|----------|
| `kafka` | Kafka StatefulSet |
| `postgres` | PostgreSQL Deployment |
| `dapr-system` | Dapr operator, placement, sentry |
| `learnflow` | All application services (6 agents, frontend, docs) |

## Idempotency

All deploy scripts are idempotent — re-running upgrades cleanly:
- `kubectl apply` for manifests
- `helm upgrade --install` for Helm charts
- `--dry-run=client -o yaml | kubectl apply` for namespace creation

## Verification

Each skill includes a verify script that outputs 2 lines:

```bash
# Infrastructure
bash deploy_kafka.sh | python verify_kafka.py
# → Kafka: 1/1 pods Running in kafka namespace
# → Status: Healthy

# Backend
bash deploy_services.sh | python verify_services.py
# → Services: 6/6 Running with Dapr sidecars
# → Health: all 6 agents deployed and healthy

# System-wide
python system_status.py | python verify_mcp.py
# → System: 3/3 components healthy
# → learnflow: healthy (7/7 pods), kafka: Running (5 topics), postgres: Running (4 tables)
```

## Troubleshooting

| Issue | Solution |
|-------|---------|
| Pod stuck Pending | `kubectl describe pod <name>` — check resources |
| Dapr sidecar not injecting | Verify `dapr.io/enabled: "true"` annotation |
| Image pull error | Use `eval $(minikube docker-env)` before building |
| Kafka connection refused | Wait 30s after Kafka deploy for KRaft init |
