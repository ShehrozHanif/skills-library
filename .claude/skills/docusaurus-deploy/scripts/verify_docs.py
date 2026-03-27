#!/usr/bin/env python3
"""Verify Docusaurus docs deployment. Reads JSON from stdin."""
import json
import sys


def main():
    try:
        data = json.load(sys.stdin)
    except (json.JSONDecodeError, Exception):
        print("Docs: parse error")
        print("Status: Unknown")
        sys.exit(1)

    if isinstance(data, dict) and "error" in data:
        print(f"Docs: {data['error']}")
        print("Status: Error")
        sys.exit(1)

    pods = data if isinstance(data, list) else []
    running = sum(1 for p in pods if p.get("phase") == "Running")
    total = len(pods)

    print(f"Docs: {running}/{total} pods Running in learnflow namespace")
    if running >= 1:
        print("Status: Healthy")
    else:
        print("Status: Unhealthy")
        sys.exit(1)


if __name__ == "__main__":
    main()
