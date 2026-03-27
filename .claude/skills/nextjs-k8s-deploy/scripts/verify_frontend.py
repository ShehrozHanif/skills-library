#!/usr/bin/env python3
"""verify_frontend.py — Check LearnFlow frontend pod is running."""

import sys
import json


def main():
    raw = sys.stdin.read()
    if not raw.strip():
        print("Error: No input. Run: bash deploy_frontend.sh | python verify_frontend.py", file=sys.stderr)
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
    issues = []

    for pod in pods:
        name = pod.get("metadata", {}).get("name", "unknown")
        phase = pod.get("status", {}).get("phase", "")

        if phase == "Running":
            running += 1

        for cs in pod.get("status", {}).get("containerStatuses", []):
            waiting = cs.get("state", {}).get("waiting", {})
            if waiting.get("reason") == "CrashLoopBackOff":
                issues.append(f"{name}: CrashLoopBackOff")

    print(f"Frontend: {running}/{total} pods Running")
    if issues:
        print(f"Issues: {'; '.join(issues[:3])}")
    elif running > 0:
        print("Health: frontend deployed and healthy")
    else:
        print("Status: no running pods found")


if __name__ == "__main__":
    main()
