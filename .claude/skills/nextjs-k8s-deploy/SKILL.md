---
name: nextjs-k8s-deploy
description: Deploy Next.js frontend with Monaco editor on Kubernetes. Use when deploying the LearnFlow frontend or student/teacher dashboards.
---
# Next.js K8s Deploy
## Instructions
- Deploy frontend: `bash scripts/deploy_frontend.sh | python scripts/verify_frontend.py`
- Includes: Student dashboard (chat + code editor + progress), Teacher dashboard (class overview + alerts)
- Requires: Backend services deployed in learnflow namespace
