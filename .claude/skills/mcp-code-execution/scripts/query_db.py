#!/usr/bin/env python3
"""query_db.py — Query PostgreSQL for AI agent context.

Replaces direct MCP database server (~10,000 tokens) with a script
that returns only relevant rows (~20 tokens per query).

Usage:
  python query_db.py                     # List tables
  python query_db.py users               # Query users table
  python query_db.py progress 5          # Top 5 progress records
  python query_db.py schema users        # Show table schema
"""

import os
import subprocess
import json
import sys

PG_HOST = "postgresql.postgres.svc.cluster.local"
PG_USER = "postgres"
PG_DB = "postgres"
PG_PORT = "5432"
MAX_OUTPUT_ROWS = 3


def _get_pg_password() -> str:
    """Get PostgreSQL password from env var or K8s secret."""
    pw = os.environ.get("PG_PASSWORD") or os.environ.get("PGPASSWORD")
    if pw:
        return pw
    try:
        result = subprocess.run(
            ["kubectl", "get", "secret", "-n", "postgres", "postgresql",
             "-o", "jsonpath={.data.postgres-password}"],
            capture_output=True, text=True, timeout=10,
        )
        if result.stdout.strip():
            import base64
            return base64.b64decode(result.stdout.strip()).decode()
    except Exception:
        pass
    return ""


def pg_exec(sql: str) -> str:
    """Execute SQL via kubectl exec into PostgreSQL pod."""
    cmd = [
        "kubectl", "exec", "-n", "postgres",
        "deploy/postgresql", "--",
        "psql", "-h", "localhost", "-U", PG_USER, "-d", PG_DB,
        "-t", "-A", "-c", sql,
    ]
    env = {"PGPASSWORD": _get_pg_password(), "PATH": "/usr/bin:/bin:/usr/local/bin"}
    result = subprocess.run(cmd, capture_output=True, text=True, timeout=30, env=env)
    return result.stdout.strip()


def list_tables() -> list[str]:
    raw = pg_exec(
        "SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;"
    )
    return [line for line in raw.split("\n") if line.strip()]


def query_table(table: str, limit: int = 10) -> list[dict]:
    # Sanitize table name (alphanumeric + underscore only)
    safe_table = "".join(c for c in table if c.isalnum() or c == "_")
    raw = pg_exec(f"SELECT row_to_json(t) FROM (SELECT * FROM {safe_table} LIMIT {limit}) t;")
    rows = []
    for line in raw.split("\n"):
        line = line.strip()
        if line:
            try:
                rows.append(json.loads(line))
            except json.JSONDecodeError:
                continue
    return rows


def table_schema(table: str) -> list[dict]:
    safe_table = "".join(c for c in table if c.isalnum() or c == "_")
    raw = pg_exec(
        f"SELECT column_name, data_type, is_nullable "
        f"FROM information_schema.columns WHERE table_name = '{safe_table}' "
        f"ORDER BY ordinal_position;"
    )
    cols = []
    for line in raw.split("\n"):
        parts = line.strip().split("|")
        if len(parts) == 3:
            cols.append({
                "column": parts[0].strip(),
                "type": parts[1].strip(),
                "nullable": parts[2].strip(),
            })
    return cols


def main():
    args = sys.argv[1:]

    if not args:
        tables = list_tables()
        shown = tables[:MAX_OUTPUT_ROWS]
        extra = len(tables) - len(shown)
        print(f"Tables: {len(tables)} — {', '.join(shown)}{f' (+{extra} more)' if extra else ''}")
        return

    if args[0] == "schema" and len(args) > 1:
        cols = table_schema(args[1])
        col_summary = ", ".join(f"{c['column']}:{c['type']}" for c in cols[:MAX_OUTPUT_ROWS])
        extra = len(cols) - min(len(cols), MAX_OUTPUT_ROWS)
        print(f"Schema: {args[1]} ({len(cols)} columns) — {col_summary}{f' (+{extra} more)' if extra else ''}")
        return

    table = args[0]
    limit = int(args[1]) if len(args) > 1 else 10
    rows = query_table(table, limit)
    print(f"{table}: {len(rows)} rows")
    for row in rows[:MAX_OUTPUT_ROWS]:
        print(f"  {json.dumps(row)}")
    if len(rows) > MAX_OUTPUT_ROWS:
        print(f"  (+{len(rows) - MAX_OUTPUT_ROWS} more rows)")


if __name__ == "__main__":
    main()
