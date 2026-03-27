#!/usr/bin/env python3
"""verify_services.py — Check 6 LearnFlow agents are running with Dapr sidecars."""

import sys
import json


def main():
    raw = sys.stdin.read()
    if not raw.strip():
        print("Error: No input. Run: bash deploy_services.sh | python verify_services.py", file=sys.stderr)
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
    dapr_injected = 0
    issues = []

    for pod in pods:
        name = pod.get("metadata", {}).get("name", "unknown")
        phase = pod.get("status", {}).get("phase", "")
        containers = pod.get("status", {}).get("containerStatuses", [])
        container_count = len(containers)

        if phase == "Running":
            running += 1

        # Dapr sidecar = 2 containers (app + daprd)
        if container_count >= 2:
            dapr_injected += 1
        elif phase == "Running":
            issues.append(f"{name}: no Dapr sidecar ({container_count} containers)")

        # Check for crash loops
        for cs in containers:
            waiting = cs.get("state", {}).get("waiting", {})
            if waiting.get("reason") == "CrashLoopBackOff":
                issues.append(f"{name}: CrashLoopBackOff")

    expected = 6
    sidecar_status = f"with Dapr sidecars" if dapr_injected >= expected else f"({dapr_injected}/{total} with sidecars)"

    print(f"Services: {running}/{expected} Running {sidecar_status}")
    if issues:
        print(f"Issues: {'; '.join(issues[:3])}")
    elif running >= expected:
        print(f"Health: all {expected} agents deployed and healthy")
    else:
        print(f"Status: {total} pods found, {running} running")


if __name__ == "__main__":
    main()
