---
name: docusaurus-deploy
description: Deploy Docusaurus documentation site on Kubernetes. Use when deploying or updating the LearnFlow docs.
---
# Docusaurus Deploy
## Instructions
- Deploy docs: `bash scripts/deploy_docs.sh | python scripts/verify_docs.py`
- Includes: Skills guide, architecture, getting started, API reference
- Access: `kubectl port-forward -n learnflow svc/learnflow-docs 4000:80`
