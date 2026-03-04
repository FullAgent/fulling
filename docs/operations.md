# Operations Manual

This document provides guidance for deployment and Kubernetes operations.

## Table of Contents

- [Deployment](#deployment)
- [Kubernetes Resources](#kubernetes-resources)
- [Resource Management](#resource-management)
- [Monitoring](#monitoring)
- [Backup and Recovery](#backup-and-recovery)

## Deployment

### Prerequisites

- Kubernetes cluster with KubeBlocks installed
- Sealos platform (recommended) or any K8s cluster
- Container registry access

### Environment Variables

Required environment variables for production:

```env
# Database
DATABASE_URL="postgresql://..."

# NextAuth
NEXTAUTH_URL="https://your-domain.com"
NEXTAUTH_SECRET="your-secret"
AUTH_TRUST_HOST="true"

# GitHub OAuth
GITHUB_CLIENT_ID="..."
GITHUB_CLIENT_SECRET="..."

# GitHub App (optional)
GITHUB_APP_ID="..."
GITHUB_APP_PRIVATE_KEY="..."

# Sealos OAuth
SEALOS_JWT_SECRET="..."

# Kubernetes
RUNTIME_IMAGE="docker.io/limbo2342/fullstack-web-runtime:sha-ca2470e"

# Aiproxy (optional)
AIPROXY_ENDPOINT="..."
ANTHROPIC_BASE_URL="..."

# Logging
LOG_LEVEL="info"
```

### Deploy to Sealos

1. Build and push Docker image:
```bash
docker build -t your-registry/fulling:latest .
docker push your-registry/fulling:latest
```

2. Create Sealos application with the image
3. Configure environment variables
4. Set up domain and SSL

### Resource Requirements

**Main Application**:
- CPU: 500m request, 2000m limit
- Memory: 512Mi request, 2Gi limit

**Per Sandbox**:
- CPU: 20m request, 2000m limit
- Memory: 25Mi request, 4096Mi limit
- Storage: 10Gi PVC

**Per Database**:
- CPU: 100m request, 1000m limit
- Memory: 102Mi request, 1024Mi limit
- Storage: 3Gi PVC

## Kubernetes Resources

### Per Project Resources

Each project creates the following K8s resources:

**1. StatefulSet (Sandbox)**:
- Name: `{project-name}-{random-6chars}`
- Image: `limbo2342/fullstack-web-runtime:sha-ca2470e`
- Ports: 3000 (app), 7681 (ttyd), 8080 (filebrowser)
- PVC: 10Gi (persistent storage)

**2. Service**:
- Name: `{sandbox-name}-service`
- Ports: 3000, 7681, 8080

**3. Ingresses**:
- App: `{sandbox-name}-app.{domain}` → 3000
- Terminal: `{sandbox-name}-ttyd.{domain}` → 7681
- FileBrowser: `{sandbox-name}-filebrowser.{domain}` → 8080

**4. PostgreSQL Cluster (KubeBlocks)**:
- Name: `{project-name}-{random-6chars}`
- Version: postgresql-14.8.0
- Storage: 3Gi

### Labels

All resources have these labels:

```yaml
labels:
  cloud.sealos.io/app-deploy-manager: {resource-name}
  project.fullstackagent.io/name: {k8s-project-name}
  app: {resource-name}
```

## Resource Management

### Start/Stop Projects

**Stop** (scales replicas to 0):
```bash
# Via API
POST /api/projects/{id}/stop

# Via kubectl
kubectl scale statefulset {sandbox-name} --replicas=0 -n {namespace}
```

**Start** (scales replicas to 1):
```bash
# Via API
POST /api/projects/{id}/start

# Via kubectl
kubectl scale statefulset {sandbox-name} --replicas=1 -n {namespace}
```

### Delete Projects

```bash
# Via API (soft delete)
POST /api/projects/{id}/delete

# Via kubectl (hard delete)
kubectl delete statefulset {sandbox-name} -n {namespace}
kubectl delete service {sandbox-name}-service -n {namespace}
kubectl delete ingress {sandbox-name}-app-ingress -n {namespace}
kubectl delete ingress {sandbox-name}-ttyd-ingress -n {namespace}
kubectl delete ingress {sandbox-name}-filebrowser-ingress -n {namespace}
kubectl delete pvc data-{sandbox-name}-0 -n {namespace}
```

### Update Runtime Image

1. Build and push new image:
```bash
cd runtime
./build.sh
./push-to-dockerhub.sh
```

2. Update `lib/k8s/versions.ts`:
```typescript
export const VERSIONS = {
  RUNTIME_IMAGE: 'docker.io/limbo2342/fullstack-web-runtime:sha-new',
  // ...
}
```

3. Restart main app to pick up new version

4. Existing sandboxes will use new image on next restart

## Monitoring

### Health Checks

**Main Application**:
```bash
curl https://your-domain.com/api/health
```

**Sandbox Containers**:
```bash
kubectl get pods -n {namespace} -l app={sandbox-name}
```

### Logs

**Main Application**:
```bash
# Sealos
sealos logs {app-name}

# kubectl
kubectl logs -n {namespace} {pod-name}
```

**Sandbox Containers**:
```bash
kubectl logs -n {namespace} {sandbox-pod-name}

# ttyd logs
kubectl logs -n {namespace} {sandbox-pod-name} | grep ttyd
```

### Metrics

Key metrics to monitor:
- API response time (< 100ms)
- Reconciliation job duration (< 5s)
- Database connections
- K8s API calls
- Pod restart count

## Backup and Recovery

### Database Backup

**Main Application Database**:
```bash
pg_dump -h localhost -U user -d fullstackagent > backup.sql
```

**Project Databases (KubeBlocks)**:
```bash
# KubeBlocks automatic backup
kubectl get backup -n {namespace}

# Manual backup
kubectl apply -f - <<EOF
apiVersion: dataprotection.kubeblocks.io/v1alpha1
kind: Backup
metadata:
  name: manual-backup
  namespace: {namespace}
spec:
  backupPolicyName: {cluster-name}-backup-policy
  backupType: full
EOF
```

### Recovery

**Main Application**:
```bash
psql -h localhost -U user -d fullstackagent < backup.sql
```

**Project Database**:
```bash
# Restore from backup
kubectl apply -f - <<EOF
apiVersion: dataprotection.kubeblocks.io/v1alpha1
kind: Restore
metadata:
  name: restore-from-backup
  namespace: {namespace}
spec:
  backupName: manual-backup
  restoreTime: "2024-01-15T10:00:00Z"
EOF
```

### PVC Recovery

If sandbox PVC is corrupted:
```bash
# 1. Stop sandbox
kubectl scale statefulset {sandbox-name} --replicas=0 -n {namespace}

# 2. Delete PVC
kubectl delete pvc data-{sandbox-name}-0 -n {namespace}

# 3. Start sandbox (creates new PVC)
kubectl scale statefulset {sandbox-name} --replicas=1 -n {namespace}
```

## Common Operations

### Check Resource Status

```bash
# List all sandboxes
kubectl get statefulsets -A -l project.fullstackagent.io/name

# List all databases
kubectl get clusters -A

# Check specific sandbox
kubectl describe statefulset {sandbox-name} -n {namespace}
```

### Access Sandbox Shell

```bash
# Via kubectl
kubectl exec -it -n {namespace} {pod-name} -- /bin/bash

# Via ttyd (web terminal)
# Open https://{sandbox-name}-ttyd.{domain}?authorization={token}
```

### Debug Network Issues

```bash
# Check ingress
kubectl get ingress -n {namespace}
kubectl describe ingress {sandbox-name}-app-ingress -n {namespace}

# Check service
kubectl get svc -n {namespace}
kubectl describe svc {sandbox-name}-service -n {namespace}

# Check endpoints
kubectl get endpoints -n {namespace}
```

## Related Documentation

- [Architecture](./architecture.md) - Reconciliation pattern and event system
- [Development Guide](./development.md) - Local development and code patterns
- [Troubleshooting](./troubleshooting.md) - Common issues and debugging
