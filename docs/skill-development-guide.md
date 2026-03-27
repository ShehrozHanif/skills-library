# Skill Development Guide

## The MCP Code Execution Pattern

Skills are the emerging standard for teaching AI coding agents. Instead of loading MCP servers directly (consuming 35,000+ tokens at startup), each interaction is wrapped in a script that executes outside the agent's context.

### The Pattern

```
.claude/skills/<skill-name>/
├── SKILL.md              # Instructions (~100 tokens) — loaded by agent
├── scripts/
│   ├── deploy.sh         # Heavy lifting (0 tokens) — executed, not loaded
│   └── verify.py         # Verification (0 tokens) — executed, not loaded
└── references/
    └── guide.md          # Deep docs (0 tokens) — loaded on-demand only
```

### Token Budget

| Component | Tokens | When |
|-----------|--------|------|
| SKILL.md | ~100 | Loaded when triggered |
| scripts/ | 0 | Executed outside context |
| references/ | 0 | Loaded only if needed |
| Output | ~10-50 | Only result enters context |
| **Total** | **~110-150** | **Per interaction** |

vs Direct MCP: ~35,000 tokens per session (3 servers).

## Creating a New Skill

### Step 1: SKILL.md

Keep it under 100 tokens. Include: name, description, when to use, and pipeline commands.

```yaml
---
name: my-skill
description: One-line description of what this skill does
---

# My Skill

## When to Use
- Trigger condition 1
- Trigger condition 2

## Instructions
1. Run deployment: `bash scripts/deploy.sh | python scripts/verify.py`

## Validation
- [ ] Expected outcome 1
- [ ] Expected outcome 2
```

### Step 2: Deploy Script (bash)

```bash
#!/usr/bin/env bash
set -euo pipefail

# Prerequisites check
command -v kubectl >/dev/null 2>&1 || { echo '{"error": "kubectl not found"}'; exit 1; }

# Create namespace (idempotent)
kubectl create namespace my-ns --dry-run=client -o yaml | kubectl apply -f -

# Apply manifests (idempotent)
kubectl apply -f templates/k8s/deployment.yaml

# Wait for rollout
kubectl rollout status deployment/my-app -n my-ns --timeout=120s

# Output JSON for piping to verify script
kubectl get pods -n my-ns -o json
```

### Step 3: Verify Script (python)

```python
#!/usr/bin/env python3
"""Reads JSON from stdin, outputs exactly 2 lines."""
import json, sys

data = json.load(sys.stdin)
pods = data.get("items", [])
running = sum(1 for p in pods if p["status"]["phase"] == "Running")

print(f"MyApp: {running}/{len(pods)} pods Running in my-ns namespace")
print(f"Status: {'Healthy' if running >= 1 else 'Unhealthy'}")

if running < 1:
    sys.exit(1)
```

### Step 4: Reference Guide

Only loaded when the agent needs deep context. Include configuration options, troubleshooting, and advanced usage.

## Design Rules

### 1. Output < 5 Lines
Scripts must produce minimal output. Cap lists, summarize data, use inline formats.

### 2. No Hardcoded Secrets
Read from environment variables or K8s secrets:
```python
password = os.environ.get("PG_PASSWORD", "")
```

### 3. Cross-Agent Compatible
Use only bash + python (standard library). No agent-specific dependencies.

### 4. Idempotent Scripts
Use `kubectl apply` (not `create`), `helm upgrade --install`, and `--dry-run=client`.

### 5. Pipeline Pattern
Every skill follows: `bash deploy.sh | python verify.py`
- Deploy script outputs JSON to stdout
- Verify script reads JSON from stdin
- Verify outputs exactly 2 lines

### 6. Fail-Fast
Use `set -euo pipefail` in bash. Exit with non-zero on failure.

## LearnFlow Skills Examples

### Infrastructure Skill (kafka-k8s-setup)

```bash
# Deploy Kafka
bash .claude/skills/kafka-k8s-setup/scripts/deploy_kafka.sh | \
  python .claude/skills/kafka-k8s-setup/scripts/verify_kafka.py

# Create topics
bash .claude/skills/kafka-k8s-setup/scripts/create_topics.sh learning,code,exercise,struggle,responses | \
  python .claude/skills/kafka-k8s-setup/scripts/verify_topics.py
```

### Service Skill (fastapi-dapr-agent)

```bash
# Deploy 6 AI agents with Dapr sidecars
bash .claude/skills/fastapi-dapr-agent/scripts/deploy_services.sh | \
  python .claude/skills/fastapi-dapr-agent/scripts/verify_services.py

# Test triage routing
bash .claude/skills/fastapi-dapr-agent/scripts/test_routing.sh | \
  python .claude/skills/fastapi-dapr-agent/scripts/verify_routing.py
```

### MCP Replacement Skill (mcp-code-execution)

```bash
# Instead of connecting 3 MCP servers (~35,000 tokens):
python .claude/skills/mcp-code-execution/scripts/query_k8s.py learnflow    # ~50 tokens
python .claude/skills/mcp-code-execution/scripts/query_db.py users 5       # ~30 tokens
python .claude/skills/mcp-code-execution/scripts/query_kafka.py            # ~30 tokens

# Full system health
python .claude/skills/mcp-code-execution/scripts/system_status.py | \
  python .claude/skills/mcp-code-execution/scripts/verify_mcp.py
```

## Skill Checklist

Before shipping a new skill, verify:

- [ ] SKILL.md < 100 tokens (use `wc -w SKILL.md`)
- [ ] All script outputs < 5 lines
- [ ] Pipeline works: `bash deploy.sh | python verify.py`
- [ ] Verify script outputs exactly 2 lines
- [ ] No hardcoded secrets
- [ ] Cross-agent compatible (bash + python, standard library)
- [ ] Idempotent (re-run produces no errors)
- [ ] Reference guide included for deep context
- [ ] K8s resources within budget
