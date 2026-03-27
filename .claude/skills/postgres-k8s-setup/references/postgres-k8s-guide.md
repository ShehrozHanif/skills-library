# PostgreSQL on Kubernetes Guide

## Bitnami Helm Chart

### Default Dev Values
```bash
helm upgrade --install postgresql bitnami/postgresql \
  --namespace postgres --create-namespace \
  --set auth.postgresPassword=learnflow-dev \
  --set primary.resourcePreset=small \
  --wait --timeout 120s
```

### Resource Usage
- Primary pod: ~256MB RAM, 0.25 CPU
- Total: ~256MB (fits in 3GB Minikube)

## Connection

### Internal Endpoint
```
postgresql.postgres.svc.cluster.local:5432
```

### Test Connectivity
```bash
kubectl exec postgresql-0 -n postgres -- \
  pg_isready -U postgres
```

### Run SQL via kubectl exec
```bash
kubectl exec postgresql-0 -n postgres -- \
  psql -U postgres -d postgres -c "SELECT 1;"
```

### Run SQL File
```bash
kubectl exec -i postgresql-0 -n postgres -- \
  psql -U postgres -d postgres < migration.sql
```

## LearnFlow Schema

### Tables
| Table | Purpose |
|-------|---------|
| users | User accounts (students, teachers) |
| progress | Topic mastery tracking |
| submissions | Code submission history |
| exercises | Coding challenges |

### Mastery Calculation
```
mastery = exercises_completed * 0.4 + quiz_score * 0.3 + code_quality * 0.2 + streak * 0.1
```

## Troubleshooting

### Pod stuck in Pending
```bash
kubectl describe pod postgresql-0 -n postgres
# Check: PVC binding, storage class
```

### Authentication failed
```bash
# Verify password was set correctly
kubectl get secret postgresql -n postgres -o jsonpath='{.data.postgres-password}' | base64 -d
```

### Connection refused
```bash
kubectl get svc -n postgres
# Internal: postgresql.postgres.svc.cluster.local:5432
```
