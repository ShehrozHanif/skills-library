---
sidebar_position: 2
---

# Getting Started

## Prerequisites

- Docker Desktop running
- Minikube: `minikube start --driver=docker --memory=3072`
- kubectl, Helm installed
- Claude Code or Goose installed

## Quick Deploy (All Services)

```bash
# 1. Infrastructure
bash .claude/skills/kafka-k8s-setup/scripts/deploy_kafka.sh | python .claude/skills/kafka-k8s-setup/scripts/verify_kafka.py
bash .claude/skills/kafka-k8s-setup/scripts/create_topics.sh learning code exercise struggle
bash .claude/skills/postgres-k8s-setup/scripts/deploy_postgres.sh | python .claude/skills/postgres-k8s-setup/scripts/verify_postgres.py
bash .claude/skills/postgres-k8s-setup/scripts/run_migrations.sh | python .claude/skills/postgres-k8s-setup/scripts/verify_schema.py

# 2. Backend (6 AI agents)
bash .claude/skills/fastapi-dapr-agent/scripts/deploy_services.sh | python .claude/skills/fastapi-dapr-agent/scripts/verify_services.py

# 3. Frontend
bash .claude/skills/nextjs-k8s-deploy/scripts/deploy_frontend.sh | python .claude/skills/nextjs-k8s-deploy/scripts/verify_frontend.py

# 4. Documentation
bash .claude/skills/docusaurus-deploy/scripts/deploy_docs.sh | python .claude/skills/docusaurus-deploy/scripts/verify_docs.py
```

## Access the Application

```bash
# Frontend (Student/Teacher dashboards)
kubectl port-forward -n learnflow svc/learnflow-frontend 3000:80
# → http://localhost:3000

# Documentation
kubectl port-forward -n learnflow svc/learnflow-docs 4000:80
# → http://localhost:4000
```

## System Health Check

```bash
python .claude/skills/mcp-code-execution/scripts/system_status.py | python .claude/skills/mcp-code-execution/scripts/verify_mcp.py
```
