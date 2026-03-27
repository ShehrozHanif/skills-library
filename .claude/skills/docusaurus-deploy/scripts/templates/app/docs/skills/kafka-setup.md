---
sidebar_position: 2
---

# kafka-k8s-setup

Deploy Apache Kafka on Kubernetes using KRaft mode (no ZooKeeper).

## Usage

```bash
# Deploy Kafka
bash scripts/deploy_kafka.sh | python scripts/verify_kafka.py

# Create topics
bash scripts/create_topics.sh learning code exercise struggle

# Verify topics
bash scripts/create_topics.sh learning code | python scripts/verify_topics.py
```

## Architecture

- **Image**: `apache/kafka:3.9.0` (KRaft mode, single node)
- **Namespace**: `kafka`
- **Resources**: 512Mi request, 768Mi limit
- **Topics**: learning, code, exercise, struggle, responses

## Key Design Decisions

1. **Apache official image** instead of Bitnami (unavailable on Docker Hub)
2. **KRaft mode** — no ZooKeeper dependency, simpler single-node setup
3. **StatefulSet** for stable network identity (`kafka-0`)
