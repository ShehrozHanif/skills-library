#!/usr/bin/env python3
"""verify_schema.py — Parses JSON from run_migrations.sh, prints schema summary."""

import sys
import json


def main():
    raw = sys.stdin.read()
    if not raw.strip():
        print("Error: No input. Run: bash run_migrations.sh | python verify_schema.py", file=sys.stderr)
        sys.exit(1)

    try:
        data = json.loads(raw)
    except json.JSONDecodeError as e:
        print(f"Error: Invalid JSON: {e}", file=sys.stderr)
        sys.exit(1)

    if isinstance(data, dict) and "error" in data:
        print(f"Error: {data['error']}")
        sys.exit(1)

    applied = sum(1 for m in data if m.get("status") == "applied")
    failed = sum(1 for m in data if m.get("status") == "failed")
    total = len(data)

    files = [m.get("file", "?") for m in data]
    status = "OK" if failed == 0 else f"FAILED ({failed} errors)"
    print(f"Migrations: {applied}/{total} applied successfully")
    print(f"Status: {status} | Files: {', '.join(files)}")


if __name__ == "__main__":
    main()
