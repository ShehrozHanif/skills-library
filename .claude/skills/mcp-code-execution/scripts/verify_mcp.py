#!/usr/bin/env python3
"""verify_mcp.py — Verify MCP Code Execution pattern outputs."""

import sys
import json


def main():
    raw = sys.stdin.read()
    if not raw.strip():
        print("Error: No input. Run: python system_status.py | python verify_mcp.py", file=sys.stderr)
        sys.exit(1)

    try:
        data = json.loads(raw)
    except json.JSONDecodeError as e:
        print(f"Error: Invalid JSON: {e}", file=sys.stderr)
        sys.exit(1)

    components = []
    healthy = 0

    for name, info in data.items():
        status = info.get("status", "unknown")
        is_ok = status in ("healthy", "Running")
        if is_ok:
            healthy += 1
        detail = ""
        if "pods" in info:
            detail = f" ({info['running']}/{info['pods']} pods)"
        elif "topics" in info:
            detail = f" ({info['topics']} topics)"
        elif "tables" in info:
            detail = f" ({info['tables']} tables)"
        components.append(f"{name}: {status}{detail}")

    total = len(components)
    print(f"System: {healthy}/{total} components healthy")
    print(", ".join(components))


if __name__ == "__main__":
    main()
