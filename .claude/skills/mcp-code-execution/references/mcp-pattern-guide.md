# MCP Code Execution Pattern Guide

## The Problem: MCP Bloat
Direct MCP server connections consume 10,000-50,000+ tokens at startup:
- 1 MCP server (5 tools) = ~10,000 tokens
- 3 MCP servers (15 tools) = ~30,000 tokens
- 5 MCP servers (25 tools) = ~50,000+ tokens

Intermediate results flow through context twice (read + write), doubling the cost.

## The Solution: Skills + Code Execution
Instead of loading MCP tools directly, wrap them in Skills:

1. **SKILL.md** (~100 tokens) — tells AI WHAT to do
2. **scripts/*.py** (0 tokens) — executed outside context
3. **Output** (~10-50 tokens) — only the result enters context

**Result**: 80-98% token reduction while maintaining full capability.

## LearnFlow MCP Scripts

### query_k8s.py — Kubernetes Context
Replaces: MCP K8s server (~15,000 tokens at startup)
```bash
python scripts/query_k8s.py                    # All namespaces
python scripts/query_k8s.py learnflow          # Specific namespace
python scripts/query_k8s.py learnflow logs POD # Pod logs
```
Output: ~5 lines (vs full pod JSON at ~2,000 tokens per pod)

### query_db.py — PostgreSQL Queries
Replaces: MCP PostgreSQL server (~10,000 tokens at startup)
```bash
python scripts/query_db.py                     # List tables
python scripts/query_db.py users 5             # Query top 5 users
python scripts/query_db.py schema progress     # Table schema
```
Output: ~5 lines (vs raw query results at ~500 tokens per table)

### query_kafka.py — Kafka Topics & Consumers
Replaces: MCP Kafka server (~10,000 tokens at startup)
```bash
python scripts/query_kafka.py              # All info
python scripts/query_kafka.py topics       # Topics only
python scripts/query_kafka.py consumers    # Consumer groups
```
Output: ~5 lines (vs Kafka metadata at ~1,000 tokens)

### system_status.py — Full System Health
Aggregates all three into a single JSON output:
```bash
python scripts/system_status.py | python scripts/verify_mcp.py
```
Output: 2 lines (vs 3 separate MCP servers at ~45,000 tokens total)

## Token Savings Summary

| MCP Approach | Tokens | Cost |
|-------------|--------|------|
| Direct K8s MCP | ~15,000 | At startup, every session |
| Direct DB MCP | ~10,000 | At startup, every session |
| Direct Kafka MCP | ~10,000 | At startup, every session |
| **All 3 direct** | **~35,000+** | **Before any work** |
| query_k8s.py | ~50 | Only when needed |
| query_db.py | ~30 | Only when needed |
| query_kafka.py | ~30 | Only when needed |
| **All 3 scripts** | **~110** | **On demand** |
| **Savings** | **~99.7%** | |
