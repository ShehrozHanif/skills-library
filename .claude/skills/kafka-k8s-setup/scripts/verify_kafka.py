#!/usr/bin/env python3
"""verify_kafka.py — Parses kubectl JSON from deploy_kafka.sh, prints health summary."""

import sys
import json


def main():
    raw = sys.stdin.read()
    if not raw.strip():
        print("Error: No input. Run: bash deploy_kafka.sh | python verify_kafka.py", file=sys.stderr)
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
    crashloop = 0

    for pod in pods:
        phase = pod.get("status", {}).get("phase", "")
        if phase == "Running":
            running += 1
        for cs in pod.get("status", {}).get("containerStatuses", []):
            waiting = cs.get("state", {}).get("waiting", {})
            if waiting.get("reason") == "CrashLoopBackOff":
                crashloop += 1

    if running == total and total > 0 and crashloop == 0:
        status = "Healthy"
    elif crashloop > 0:
        status = f"Unhealthy ({crashloop} pods in CrashLoopBackOff)"
    elif total == 0:
        status = "No pods found"
    else:
        status = "Degraded"

    print(f"Kafka: {running}/{total} pods Running in kafka namespace")
    print(f"Status: {status}")


if __name__ == "__main__":
    main()
