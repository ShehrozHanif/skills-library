#!/usr/bin/env bash
# deploy_kafka.sh — Deploy Kafka on K8s using Apache official image (KRaft mode)
# Usage: bash deploy_kafka.sh
# Pipe to verify: bash deploy_kafka.sh | python verify_kafka.py

set -uo pipefail

# Check prerequisites
if ! command -v kubectl &>/dev/null; then
  echo '{"error": "kubectl not found in PATH"}'; exit 1
fi
if ! kubectl cluster-info &>/dev/null; then
  echo '{"error": "Cluster not reachable"}'; exit 1
fi

# Create namespace
kubectl create namespace kafka --dry-run=client -o yaml 2>/dev/null | kubectl apply -f - >/dev/null 2>&1

# Apply Kafka manifest (KRaft mode, single node, Apache official image)
kubectl apply -n kafka -f - >/dev/null 2>&1 <<'MANIFEST'
apiVersion: v1
kind: Service
metadata:
  name: kafka
  namespace: kafka
spec:
  ports:
    - port: 9092
      name: plaintext
  clusterIP: None
  selector:
    app: kafka
---
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: kafka
  namespace: kafka
spec:
  serviceName: kafka
  replicas: 1
  selector:
    matchLabels:
      app: kafka
  template:
    metadata:
      labels:
        app: kafka
    spec:
      containers:
        - name: kafka
          image: apache/kafka:3.9.0
          ports:
            - containerPort: 9092
          env:
            - name: KAFKA_NODE_ID
              value: "1"
            - name: KAFKA_PROCESS_ROLES
              value: "broker,controller"
            - name: KAFKA_LISTENERS
              value: "PLAINTEXT://:9092,CONTROLLER://:9093"
            - name: KAFKA_ADVERTISED_LISTENERS
              value: "PLAINTEXT://kafka-0.kafka.kafka.svc.cluster.local:9092"
            - name: KAFKA_CONTROLLER_LISTENER_NAMES
              value: "CONTROLLER"
            - name: KAFKA_LISTENER_SECURITY_PROTOCOL_MAP
              value: "CONTROLLER:PLAINTEXT,PLAINTEXT:PLAINTEXT"
            - name: KAFKA_CONTROLLER_QUORUM_VOTERS
              value: "1@localhost:9093"
            - name: KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR
              value: "1"
            - name: KAFKA_TRANSACTION_STATE_LOG_REPLICATION_FACTOR
              value: "1"
            - name: KAFKA_TRANSACTION_STATE_LOG_MIN_ISR
              value: "1"
            - name: KAFKA_LOG_DIRS
              value: "/tmp/kraft-combined-logs"
            - name: CLUSTER_ID
              value: "MkU3OEVBNTcwNTJENDM2Qk"
          resources:
            requests:
              memory: "512Mi"
              cpu: "250m"
            limits:
              memory: "768Mi"
              cpu: "500m"
          readinessProbe:
            tcpSocket:
              port: 9092
            initialDelaySeconds: 30
            periodSeconds: 10
MANIFEST

# Wait for pod to be ready (up to 180s)
kubectl rollout status statefulset/kafka -n kafka --timeout=180s >/dev/null 2>&1 || {
  echo "Warning: Kafka rollout not yet complete" >&2
}

# Output pod status JSON for verify_kafka.py
kubectl get pods -n kafka -o json 2>/dev/null || echo '{"items":[]}'
