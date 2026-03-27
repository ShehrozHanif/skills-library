#!/usr/bin/env python3
"""verify_topics.py — Parses JSON from create_topics.sh, prints topic summary."""

import sys
import json


def main():
    raw = sys.stdin.read()
    if not raw.strip():
        print("Error: No input. Run: bash create_topics.sh <topics> | python verify_topics.py", file=sys.stderr)
        sys.exit(1)

    try:
        data = json.loads(raw)
    except json.JSONDecodeError as e:
        print(f"Error: Invalid JSON: {e}", file=sys.stderr)
        sys.exit(1)

    if isinstance(data, dict) and "error" in data:
        print(f"Error: {data['error']}")
        sys.exit(1)

    created = sum(1 for t in data if t.get("status") == "created")
    exists = sum(1 for t in data if t.get("status") == "exists")
    failed = sum(1 for t in data if t.get("status") == "failed")
    total = len(data)

    names = [t.get("topic", "?") for t in data]
    print(f"Topics: {created} created, {exists} existing, {failed} failed (of {total})")
    print(f"Names: {', '.join(names)}")


if __name__ == "__main__":
    main()
