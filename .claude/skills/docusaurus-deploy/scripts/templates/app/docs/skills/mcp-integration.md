---
sidebar_position: 6
---

# mcp-code-execution

MCP Code Execution pattern for real-time AI context with 99.7% token savings.

## Usage

```bash
# K8s context
python scripts/query_k8s.py learnflow

# Database queries
python scripts/query_db.py users 5

# Kafka status
python scripts/query_kafka.py

# Full system health
python scripts/system_status.py | python scripts/verify_mcp.py
```

## The Pattern

Instead of connecting MCP servers directly (consuming 35,000+ tokens at startup), each MCP interaction is wrapped in a Python script:

| Approach | Tokens | When |
|----------|--------|------|
| Direct K8s MCP | ~15,000 | Every session |
| Direct DB MCP | ~10,000 | Every session |
| Direct Kafka MCP | ~10,000 | Every session |
| **query_k8s.py** | **~50** | **On demand** |
| **query_db.py** | **~30** | **On demand** |
| **query_kafka.py** | **~30** | **On demand** |

**Savings: ~99.7% fewer tokens**

## Scripts

| Script | Replaces | Output |
|--------|----------|--------|
| `query_k8s.py` | MCP K8s server | Pods, services, logs (~5 lines) |
| `query_db.py` | MCP PostgreSQL server | Tables, rows, schema (~5 lines) |
| `query_kafka.py` | MCP Kafka server | Topics, consumers (~5 lines) |
| `system_status.py` | All 3 servers | Full system JSON (~2 lines) |
