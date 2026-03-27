---
name: k8s-foundation
description: Check Kubernetes cluster health and install Helm charts. Use when verifying cluster status or deploying basic services.
---
# K8s Foundation
## Instructions
- Check health: `bash scripts/check_cluster.sh | python scripts/verify_health.py`
- Install chart: `bash scripts/helm_install.sh <chart> <namespace>`
