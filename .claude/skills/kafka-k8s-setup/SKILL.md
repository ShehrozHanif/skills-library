---
name: kafka-k8s-setup
description: Deploy Apache Kafka on Kubernetes and manage topics. Use when deploying Kafka or creating event topics.
---
# Kafka K8s Setup
## Instructions
- Deploy Kafka: `bash scripts/deploy_kafka.sh`
- Verify deployment: `bash scripts/deploy_kafka.sh | python scripts/verify_kafka.py`
- Create topics: `bash scripts/create_topics.sh <topic1> <topic2> ...`
- Verify topics: `bash scripts/create_topics.sh <topics> | python scripts/verify_topics.py`
