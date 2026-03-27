#!/usr/bin/env python3
"""verify_postgres.py — Parses kubectl JSON from deploy_postgres.sh, checks connectivity."""

import sys
import json
import subprocess


def main():
    raw = sys.stdin.read()
    if not raw.strip():
        print("Error: No input. Run: bash deploy_postgres.sh | python verify_postgres.py", file=sys.stderr)
        sys.exit(1)

    try:
        data = json.loads(raw)
    except json.JSONDecodeError as e:
        print(f"Error: Invalid JSON: {e}", file=sys.stderr)
        sys.exit(1)

    if "error" in data:
        print(f"Error: {data['error']}")
        sys.exit(1)

    pods = data.get("items", [])
    total = len(pods)
    running = 0

    for pod in pods:
        phase = pod.get("status", {}).get("phase", "")
        if phase == "Running":
            running += 1

    # Test connectivity via pg_isready
    connection = "not tested"
    if running > 0:
        try:
            result = subprocess.run(
                ["kubectl", "exec", "postgresql-0", "-n", "postgres", "--",
                 "pg_isready", "-U", "postgres"],
                capture_output=True, text=True, timeout=10
            )
            connection = "verified" if result.returncode == 0 else "failed"
        except (subprocess.TimeoutExpired, FileNotFoundError):
            connection = "failed"

    print(f"PostgreSQL: {running}/{total} pods Running in postgres namespace")
    print(f"Connection: {connection}")


if __name__ == "__main__":
    main()
