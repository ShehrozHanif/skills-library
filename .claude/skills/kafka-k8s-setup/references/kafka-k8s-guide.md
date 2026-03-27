# Kafka on Kubernetes Guide

## Bitnami Helm Chart (KRaft Mode)

### Default Dev Values
```bash
helm upgrade --install kafka bitnami/kafka \
  --namespace kafka --create-namespace \
  --set controller.replicaCount=1 \
  --set controller.resourcePreset=small \
  --wait --timeout 120s
```

### KRaft Mode (No Zookeeper)
Bitnami Kafka v24+ defaults to KRaft mode. Single `kafka-controller-0` pod handles both controller and broker roles. No separate Zookeeper pods needed.

### Resource Usage
- Controller pod: ~512MB RAM, 0.25 CPU
- Total: ~512MB (fits in 3GB Minikube)

## Topic Management

### Create Topic
```bash
kubectl exec kafka-controller-0 -n kafka -- \
  kafka-topics.sh --bootstrap-server localhost:9092 \
  --create --topic <name> --if-not-exists \
  --partitions 1 --replication-factor 1
```

### List Topics
```bash
kubectl exec kafka-controller-0 -n kafka -- \
  kafka-topics.sh --bootstrap-server localhost:9092 --list
```

### Describe Topic
```bash
kubectl exec kafka-controller-0 -n kafka -- \
  kafka-topics.sh --bootstrap-server localhost:9092 \
  --describe --topic <name>
```

## LearnFlow Topics
| Topic | Purpose |
|-------|---------|
| learning | Student learning events |
| code | Code submission events |
| exercise | Exercise events |
| struggle | Struggle detection alerts |

## Troubleshooting

### Pod stuck in Pending
```bash
kubectl describe pod kafka-controller-0 -n kafka
# Check: resource limits, PVC binding
```

### CrashLoopBackOff
```bash
kubectl logs kafka-controller-0 -n kafka --previous
# Common: insufficient memory, storage class missing
```

### Connection refused
```bash
# Verify service exists
kubectl get svc -n kafka
# Internal endpoint: kafka.kafka.svc.cluster.local:9092
```
