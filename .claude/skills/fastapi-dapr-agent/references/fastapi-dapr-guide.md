# FastAPI + Dapr Integration Guide

## Dapr Pub/Sub with FastAPI

### Programmatic Subscriptions
Dapr calls `GET /dapr/subscribe` on app startup to discover topic subscriptions:
```python
@app.get("/dapr/subscribe")
async def subscribe():
    return [{"pubsubname": "kafka-pubsub", "topic": "my-topic", "route": "/handle"}]
```

### Handling Messages
Dapr delivers messages as CloudEvents to the registered route:
```python
@app.post("/handle")
async def handle(request: Request):
    envelope = await request.json()
    data = envelope.get("data", {})
    # Process message...
    return {"status": "ok"}
```

### Publishing Events
Use Dapr HTTP API via sidecar (localhost:3500):
```python
url = f"http://localhost:3500/v1.0/publish/kafka-pubsub/{topic}"
httpx.post(url, json=data)
```

### State Store
Save and retrieve state via Dapr:
```python
# Save
httpx.post("http://localhost:3500/v1.0/state/statestore", json=[{"key": "k", "value": "v"}])
# Get
resp = httpx.get("http://localhost:3500/v1.0/state/statestore/k")
```

## Kubernetes Annotations
Enable Dapr sidecar injection:
```yaml
annotations:
  dapr.io/enabled: "true"
  dapr.io/app-id: "my-service"
  dapr.io/app-port: "8000"
```

## Resource Budgets (Minikube 3GB)
- Dapr sidecar: 32Mi request, 64Mi limit per pod
- App container: 64Mi request, 128Mi limit per pod
- Dapr system (operator, placement, sentry): ~256Mi total

## Topic Architecture
| Topic | Producer | Consumer |
|-------|----------|----------|
| learning | triage | concepts |
| code | triage | codereview, debug |
| exercise | triage | exercise |
| struggle | triage | progress |
| responses | all specialists | progress |

## Mock Mode
Set `OPENAI_API_KEY=mock` to skip real API calls. Agents return formatted mock responses for demo/testing.
