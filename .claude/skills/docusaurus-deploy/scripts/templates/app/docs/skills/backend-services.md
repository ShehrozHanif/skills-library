---
sidebar_position: 4
---

# fastapi-dapr-agent

Deploy 6 AI tutoring microservices with FastAPI + Dapr on Kubernetes.

## Usage

```bash
# Deploy all 6 agents
bash scripts/deploy_services.sh | python scripts/verify_services.py

# Test triage routing
bash scripts/test_routing.sh | python scripts/verify_routing.py
```

## Architecture

```
Student → POST /chat → Triage Agent
                         ↓ route_message()
              ┌──────────┼──────────┬──────────┐
              ↓          ↓          ↓          ↓
         Concepts   CodeReview   Debug    Exercise
              └──────────┴──────────┴──────────┘
                         ↓ responses topic
                   Progress Agent (mastery calc)
```

## 6 Agents

| Agent | Topics | Purpose |
|-------|--------|---------|
| Triage | all | Routes student messages to specialists |
| Concepts | learning | Explains Python concepts |
| Code Review | code | Reviews code for style and correctness |
| Debug | code | Helps find and fix bugs |
| Exercise | exercise | Generates practice challenges |
| Progress | struggle, responses | Tracks mastery, detects struggles |

## Key Features

- **Single image, 6 deployments** — configured via `AGENT_NAME` env var
- **Mock mode** — `OPENAI_API_KEY=mock` for demo without real API
- **Programmatic mastery** — `calculate_mastery()` with exact weighted formula
- **Struggle detection** — 5 business rule triggers
- **Dapr pub/sub** — Kafka via Dapr sidecar for inter-agent messaging
- **Dapr state** — PostgreSQL via K8s Secret for progress tracking
