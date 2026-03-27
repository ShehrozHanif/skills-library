#!/usr/bin/env python3
"""query_kafka.py — Get Kafka topic and consumer status for AI agents.

Replaces direct MCP Kafka server with a script returning minimal output.

Usage:
  python query_kafka.py              # List topics + consumer groups
  python query_kafka.py topics       # Topics only
  python query_kafka.py consumers    # Consumer groups only
"""

import subprocess
import sys


def run_kafka(cmd_args: str) -> str:
    """Execute Kafka CLI command via kubectl exec."""
    cmd = [
        "kubectl", "exec", "kafka-0", "-n", "kafka", "--",
        "sh", "-c", f"/opt/kafka/bin/{cmd_args}",
    ]
    result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
    return result.stdout.strip()


def list_topics() -> list[str]:
    raw = run_kafka("kafka-topics.sh --list --bootstrap-server localhost:9092")
    return [t for t in raw.split("\n") if t.strip() and not t.startswith("__")]


def describe_topic(topic: str) -> dict:
    raw = run_kafka(
        f"kafka-topics.sh --describe --topic {topic} --bootstrap-server localhost:9092"
    )
    partitions = raw.count("Partition:")
    return {"topic": topic, "partitions": partitions}


def list_consumer_groups() -> list[str]:
    raw = run_kafka("kafka-consumer-groups.sh --list --bootstrap-server localhost:9092")
    return [g for g in raw.split("\n") if g.strip()]


def main():
    args = sys.argv[1:]
    mode = args[0] if args else "all"

    if mode in ("topics", "all"):
        topics = list_topics()
        print(f"Topics: {len(topics)}")
        for t in topics:
            info = describe_topic(t)
            print(f"  {t}: {info['partitions']} partitions")

    if mode in ("consumers", "all"):
        groups = list_consumer_groups()
        print(f"Consumer groups: {len(groups)}")
        for g in groups:
            print(f"  {g}")


if __name__ == "__main__":
    main()
