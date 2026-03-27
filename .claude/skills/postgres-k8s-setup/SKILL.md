---
name: postgres-k8s-setup
description: Deploy PostgreSQL on Kubernetes and manage database schema. Use when deploying PostgreSQL or running migrations.
---
# PostgreSQL K8s Setup
## Instructions
- Deploy PostgreSQL: `bash scripts/deploy_postgres.sh`
- Verify deployment: `bash scripts/deploy_postgres.sh | python scripts/verify_postgres.py`
- Run migrations: `bash scripts/run_migrations.sh`
- Verify migrations: `bash scripts/run_migrations.sh | python scripts/verify_schema.py`
