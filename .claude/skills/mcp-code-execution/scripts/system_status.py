#!/usr/bin/env python3
"""system_status.py — Full LearnFlow system health check via MCP pattern.

Aggregates K8s, Kafka, and PostgreSQL status into a single JSON output.
Replaces 3 separate MCP servers (~45,000 tokens) with one script (~100 tokens output).

Usage:
  python system_status.py
  python system_status.py | python verify_mcp.py
"""

import subprocess
import json
import sys


def run(cmd: list[str], timeout: int = 30) -> tuple[str, int]:
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout)
        return result.stdout.strip(), result.returncode
    except (subprocess.TimeoutExpired, FileNotFoundError):
        return "", 1


def check_k8s() -> dict:
    raw, rc = run(["kubectl", "get", "pods", "-n", "learnflow", "-o", "json"])
    if rc != 0 or not raw:
        return {"status": "unreachable", "pods": 0, "running": 0}
    items = json.loads(raw).get("items", [])
    running = sum(1 for p in items if p.get("status", {}).get("phase") == "Running")
    return {"status": "healthy" if running == len(items) else "degraded", "pods": len(items), "running": running}


def check_kafka() -> dict:
    raw, rc = run(["kubectl", "get", "pod", "kafka-0", "-n", "kafka", "-o", "jsonpath={.status.phase}"])
    if rc != 0:
        return {"status": "unreachable"}
    # List topics
    topics_raw, _ = run([
        "kubectl", "exec", "kafka-0", "-n", "kafka", "--",
        "sh", "-c", "/opt/kafka/bin/kafka-topics.sh --list --bootstrap-server localhost:9092",
    ])
    topics = [t for t in topics_raw.split("\n") if t.strip() and not t.startswith("__")]
    return {"status": raw if raw else "unknown", "topics": len(topics)}


def check_postgres() -> dict:
    raw, rc = run(["kubectl", "get", "pods", "-n", "postgres", "-l", "app.kubernetes.io/name=postgresql",
                    "-o", "jsonpath={.items[0].status.phase}"])
    if rc != 0:
        return {"status": "unreachable"}
    # Check table count
    tables_raw, _ = run([
        "kubectl", "exec", "-n", "postgres", "deploy/postgresql", "--",
        "psql", "-h", "localhost", "-U", "postgres", "-d", "postgres",
        "-t", "-A", "-c", "SELECT count(*) FROM pg_tables WHERE schemaname='public';",
    ])
    table_count = int(tables_raw.strip()) if tables_raw.strip().isdigit() else 0
    return {"status": raw if raw else "unknown", "tables": table_count}


def main():
    status = {
        "learnflow": check_k8s(),
        "kafka": check_kafka(),
        "postgres": check_postgres(),
    }
    print(json.dumps(status))


if __name__ == "__main__":
    main()
