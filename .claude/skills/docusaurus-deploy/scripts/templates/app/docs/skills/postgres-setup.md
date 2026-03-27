---
sidebar_position: 3
---

# postgres-k8s-setup

Deploy PostgreSQL on Kubernetes via Bitnami Helm chart with schema migrations.

## Usage

```bash
# Deploy PostgreSQL
bash scripts/deploy_postgres.sh | python scripts/verify_postgres.py

# Run migrations
bash scripts/run_migrations.sh | python scripts/verify_schema.py
```

## Schema

4 tables for LearnFlow:

| Table | Purpose |
|-------|---------|
| `users` | Student/teacher accounts |
| `progress` | Mastery scores per topic |
| `submissions` | Code submissions + feedback |
| `exercises` | Generated exercises with solutions |

## Mastery Formula

```
Topic Mastery = exercises(40%) + quizzes(30%) + code_quality(20%) + streak(10%)
```

Levels: Beginner (0-40%) → Learning (41-70%) → Proficient (71-90%) → Mastered (91-100%)
