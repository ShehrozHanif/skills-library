---
name: mcp-code-execution
description: MCP Code Execution pattern for real-time AI context. Use when AI agents need K8s, database, or Kafka system context efficiently.
---
# MCP Code Execution
## Instructions
- K8s context: `python scripts/query_k8s.py [namespace]`
- DB query: `python scripts/query_db.py [table] [limit]`
- Kafka status: `python scripts/query_kafka.py`
- Full system: `python scripts/system_status.py | python scripts/verify_mcp.py`
