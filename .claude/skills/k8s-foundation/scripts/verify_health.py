#!/usr/bin/env python3
"""verify_health.py — Parses kubectl JSON from check_cluster.sh, prints health summary."""

import sys
import json


def parse_health(data):
    """Parse combined nodes + pods JSON and return health summary."""
    # Check for error
    if "error" in data:
        return {"status": "Error", "message": data["error"]}

    # Parse nodes
    nodes = data.get("nodes", {}).get("items", [])
    total_nodes = len(nodes)
    ready_nodes = 0
    for node in nodes:
        conditions = node.get("status", {}).get("conditions", [])
        for cond in conditions:
            if cond.get("type") == "Ready" and cond.get("status") == "True":
                ready_nodes += 1

    # Parse pods
    pods = data.get("pods", {}).get("items", [])
    total_pods = len(pods)
    running_pods = 0
    crashloop_pods = 0
    for pod in pods:
        phase = pod.get("status", {}).get("phase", "")
        if phase == "Running":
            running_pods += 1
        # Check for CrashLoopBackOff
        container_statuses = pod.get("status", {}).get("containerStatuses", [])
        for cs in container_statuses:
            waiting = cs.get("state", {}).get("waiting", {})
            if waiting.get("reason") == "CrashLoopBackOff":
                crashloop_pods += 1

    # Determine overall status
    if ready_nodes == total_nodes and running_pods >= total_pods - 1 and crashloop_pods == 0:
        status = "Healthy"
    elif crashloop_pods > 0:
        status = f"Unhealthy ({crashloop_pods} pods in CrashLoopBackOff)"
    else:
        status = "Degraded"

    return {
        "total_nodes": total_nodes,
        "ready_nodes": ready_nodes,
        "total_pods": total_pods,
        "running_pods": running_pods,
        "crashloop_pods": crashloop_pods,
        "status": status,
    }


def main():
    raw = sys.stdin.read()
    if not raw.strip():
        print("Error: No input. Run: bash check_cluster.sh | python verify_health.py", file=sys.stderr)
        sys.exit(1)

    try:
        data = json.loads(raw)
    except json.JSONDecodeError as e:
        print(f"Error: Invalid JSON input: {e}", file=sys.stderr)
        sys.exit(1)

    if "error" in data:
        print(f"Error: {data['error']}")
        sys.exit(1)

    health = parse_health(data)

    # Print 3-line summary (this is what enters AI context)
    print(f"Nodes: {health['ready_nodes']}/{health['total_nodes']} Ready")
    print(f"Core Pods: {health['running_pods']}/{health['total_pods']} Running")
    print(f"Status: {health['status']}")


if __name__ == "__main__":
    main()
