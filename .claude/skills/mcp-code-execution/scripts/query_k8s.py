#!/usr/bin/env python3
"""query_k8s.py — Get K8s cluster context for AI agents.

Replaces direct MCP K8s server (~15,000 tokens at startup) with
a script that returns only relevant data (~50 tokens output).

Usage:
  python query_k8s.py                    # All namespaces summary
  python query_k8s.py learnflow          # Specific namespace
  python query_k8s.py learnflow pods     # Pods only
  python query_k8s.py learnflow logs POD # Pod logs (last 20 lines)
"""

import subprocess
import json
import sys


def run(cmd: list[str]) -> str:
    result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
    return result.stdout.strip()


def get_namespaces() -> list[str]:
    raw = run(["kubectl", "get", "namespaces", "-o", "jsonpath={.items[*].metadata.name}"])
    return raw.split()


def get_pods(namespace: str) -> list[dict]:
    raw = run(["kubectl", "get", "pods", "-n", namespace, "-o", "json"])
    if not raw:
        return []
    items = json.loads(raw).get("items", [])
    return [
        {
            "name": p["metadata"]["name"],
            "status": p["status"].get("phase", "Unknown"),
            "containers": len(p["spec"].get("containers", [])),
            "ready": sum(
                1 for c in p.get("status", {}).get("containerStatuses", [])
                if c.get("ready", False)
            ),
        }
        for p in items
    ]


def get_services(namespace: str) -> list[dict]:
    raw = run(["kubectl", "get", "services", "-n", namespace, "-o", "json"])
    if not raw:
        return []
    items = json.loads(raw).get("items", [])
    return [
        {
            "name": s["metadata"]["name"],
            "type": s["spec"].get("type", "ClusterIP"),
            "ports": [f"{p.get('port')}" for p in s["spec"].get("ports", [])],
        }
        for s in items
    ]


def get_logs(namespace: str, pod: str, lines: int = 20) -> str:
    return run(["kubectl", "logs", pod, "-n", namespace, "--tail", str(lines)])


def main():
    args = sys.argv[1:]

    MAX_ITEMS = 3

    if not args:
        # Summary of all namespaces — one line each, capped
        namespaces = get_namespaces()
        for ns in namespaces[:4]:
            pods = get_pods(ns)
            running = sum(1 for p in pods if p["status"] == "Running")
            print(f"{ns}: {running}/{len(pods)} pods Running")
        if len(namespaces) > 4:
            print(f"(+{len(namespaces) - 4} more namespaces)")
        return

    namespace = args[0]
    resource = args[1] if len(args) > 1 else "all"

    if resource == "logs" and len(args) > 2:
        pod = args[2]
        lines = int(args[3]) if len(args) > 3 else 5
        log_output = get_logs(namespace, pod, lines)
        # Cap log lines to 5
        log_lines = log_output.split("\n")[:5]
        print("\n".join(log_lines))
        return

    if resource in ("pods", "all"):
        pods = get_pods(namespace)
        running = sum(1 for p in pods if p["status"] == "Running")
        print(f"Pods: {running}/{len(pods)} Running")
        for p in pods[:MAX_ITEMS]:
            print(f"  {p['name']}: {p['status']} ({p['ready']}/{p['containers']} ready)")
        if len(pods) > MAX_ITEMS:
            print(f"  (+{len(pods) - MAX_ITEMS} more)")

    if resource in ("services", "svc", "all"):
        services = get_services(namespace)
        svc_summary = ", ".join(s["name"] for s in services[:MAX_ITEMS])
        extra = len(services) - min(len(services), MAX_ITEMS)
        print(f"Services: {len(services)} — {svc_summary}{f' (+{extra} more)' if extra else ''}")


if __name__ == "__main__":
    main()
