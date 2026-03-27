#!/usr/bin/env python3
"""verify_routing.py — Parse routing test results from test_routing.sh."""

import sys
import json


def main():
    raw = sys.stdin.read()
    if not raw.strip():
        print("Error: No input. Run: bash test_routing.sh | python verify_routing.py", file=sys.stderr)
        sys.exit(1)

    try:
        data = json.loads(raw)
    except json.JSONDecodeError as e:
        print(f"Error: Invalid JSON: {e}", file=sys.stderr)
        sys.exit(1)

    if isinstance(data, dict) and "error" in data:
        print(f"Error: {data['error']}")
        sys.exit(1)

    total = len(data)
    passed = sum(1 for t in data if t.get("match"))
    failed = [t for t in data if not t.get("match")]

    print(f"Routing: {passed}/{total} tests passed")
    if failed:
        for f in failed[:3]:
            print(f"  FAIL: expected={f['expected']} actual={f['actual']} msg=\"{f['message'][:40]}\"")
    else:
        print("All routing tests passed")


if __name__ == "__main__":
    main()
