---
name: fastapi-dapr-agent
description: Deploy FastAPI + Dapr AI tutoring microservices on Kubernetes. Use when deploying backend agents or testing routing.
---
# FastAPI Dapr Agent
## Instructions
- Deploy services: `bash scripts/deploy_services.sh | python scripts/verify_services.py`
- Test routing: `bash scripts/test_routing.sh | python scripts/verify_routing.py`
- 6 agents: triage, concepts, codereview, debug, exercise, progress
- Requires: Kafka (kafka ns), PostgreSQL (postgres ns), Dapr
