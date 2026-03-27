# kubectl & Helm Command Reference

## Health Check Commands

### Cluster Reachability
```bash
kubectl cluster-info
# Returns: Kubernetes control plane URL
```

### Node Status
```bash
kubectl get nodes -o json
# Parse: .items[].status.conditions[] where type=="Ready"
```

### Core Pods (kube-system)
```bash
kubectl get pods -n kube-system -o json
# Parse: .items[].status.phase == "Running"
# Key pods: coredns, etcd, kube-apiserver, kube-scheduler
```

## Helm Commands

### Install Chart (Idempotent)
```bash
helm upgrade --install <release> <chart> \
  --namespace <ns> --create-namespace \
  --wait --timeout 120s
```

### Add Repo
```bash
helm repo add <name> <url>
helm repo update
```

### Check Release Status
```bash
helm list -n <namespace>
helm status <release> -n <namespace>
```

## Common Patterns

### Health Summary Format
```
Nodes: X/Y Ready | Core Pods: A/B Running | Status: Healthy/Unhealthy
```

### Deployment Summary Format
```
<chart> deployed: X/Y pods Running in <namespace>
```
