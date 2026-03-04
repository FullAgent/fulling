# Troubleshooting Guide

This document provides solutions for common issues and debugging techniques.

## Table of Contents

- [Common Issues](#common-issues)
- [Debugging Commands](#debugging-commands)
- [Error Messages](#error-messages)
- [Performance Issues](#performance-issues)

## Common Issues

### Issue 1: API Endpoints Must Not Block

**Symptom**: API endpoint takes 30+ seconds to respond

**Cause**: API is directly executing K8s operations instead of using reconciliation

**Solution**: API should only update database, return immediately

```typescript
// ❌ BAD (blocking)
export async function POST(req: Request) {
  await k8sService.createSandbox() // Blocks for 30s
  return NextResponse.json({ success: true })
}

// ✅ GOOD (non-blocking)
export async function POST(req: Request) {
  await prisma.sandbox.create({
    data: { status: 'CREATING', /* ... */ }
  })
  // Reconciliation will handle K8s operations
  return NextResponse.json({ success: true })
}
```

### Issue 2: Always Use getK8sServiceForUser()

**Symptom**: "User does not have KUBECONFIG configured"

**Cause**: Trying to use global K8s service instead of user-specific

**Solution**: Always load user's kubeconfig from UserConfig table

```typescript
// ❌ BAD (old pattern)
const k8sService = new KubernetesService()

// ✅ GOOD (v0.4.0+)
const k8sService = await getK8sServiceForUser(userId)
```

### Issue 3: Optimistic Locking Prevents Concurrent Updates

**Symptom**: Reconciliation job skips some records

**Cause**: Multiple instances or rapid cycles trying to process same records

**Solution**: This is expected behavior - optimistic locking ensures single-writer

```typescript
// Repository layer automatically handles locking
const lockedSandboxes = await acquireAndLockSandboxes(10)
// Only returns sandboxes where lockedUntil IS NULL OR < NOW()
// Sets lockedUntil = NOW() + 30 seconds atomically
```

### Issue 4: Status Aggregation Rules

**Symptom**: Project shows PARTIAL status unexpectedly

**Cause**: Child resources in inconsistent states

**Solution**: Understand aggregation priority rules

**Priority order**:
1. **ERROR** - At least one resource has ERROR
2. **CREATING** - At least one resource has CREATING
3. **UPDATING** - At least one resource has UPDATING
4. **Pure states** - All same status → use that status
5. **Transition states**:
   - STARTING: All ∈ {RUNNING, STARTING}
   - STOPPING: All ∈ {STOPPED, STOPPING}
   - TERMINATING: All ∈ {TERMINATED, TERMINATING}
6. **PARTIAL** - Inconsistent mixed states

### Issue 5: ttyd Authentication Failed

**Symptom**: Terminal shows "Authentication failed"

**Cause**: Missing or incorrect TTYD_ACCESS_TOKEN

**Solution**: Check environment variable

```bash
# In sandbox pod
echo $TTYD_ACCESS_TOKEN

# Check URL format
# Should be: https://{domain}?authorization={base64(user:token)}
```

### Issue 6: FileBrowser Login Failed

**Symptom**: FileBrowser shows "Invalid credentials"

**Cause**: Missing or incorrect FILE_BROWSER_USERNAME/PASSWORD

**Solution**: Check environment variables

```bash
# In sandbox pod
echo $FILE_BROWSER_USERNAME
echo $FILE_BROWSER_PASSWORD
```

### Issue 7: Database Connection Failed

**Symptom**: Sandbox can't connect to PostgreSQL

**Cause**: Database not ready or wrong connection string

**Solution**: Check database status and connection URL

```bash
# Check database status
kubectl get cluster -n {namespace}

# Check connection URL
echo $DATABASE_URL

# Test connection
psql $DATABASE_URL
```

## Debugging Commands

### Kubernetes Resources

```bash
# Set kubeconfig
export KUBECONFIG=/path/to/kubeconfig

# Check StatefulSets
kubectl get statefulsets -n {namespace} | grep {project-name}

# Check pods
kubectl get pods -n {namespace} -l app={statefulset-name}

# Pod logs
kubectl logs -n {namespace} {pod-name}

# Pod logs (follow)
kubectl logs -f -n {namespace} {pod-name}

# Check KubeBlocks database cluster
kubectl get cluster -n {namespace} | grep {project-name}

# Get database credentials
kubectl get secret -n {namespace} {cluster-name}-conn-credential -o yaml

# Check ingresses
kubectl get ingress -n {namespace} | grep {project-name}

# Describe resource for events
kubectl describe statefulset -n {namespace} {statefulset-name}
```

### Database Queries

```bash
# Open Prisma Studio
npx prisma studio

# Direct PostgreSQL queries
psql $DATABASE_URL

# Check locked resources
psql $DATABASE_URL -c "SELECT id, status, \"lockedUntil\" FROM \"Sandbox\" WHERE \"lockedUntil\" IS NOT NULL;"
```

### Application Logs

```bash
# Main application logs
kubectl logs -n {namespace} {pod-name}

# Filter by module
kubectl logs -n {namespace} {pod-name} | grep "lib/events/sandbox"

# Filter by level
kubectl logs -n {namespace} {pod-name} | grep "ERROR"
```

## Error Messages

### "User does not have KUBECONFIG configured"

**Cause**: User hasn't uploaded kubeconfig

**Solution**:
1. Check UserConfig table for KUBECONFIG key
2. User needs to configure kubeconfig via UI or API

### "Project not found"

**Cause**: Project doesn't exist or user doesn't have access

**Solution**:
1. Check project ID
2. Check user ID matches project owner
3. Check namespace matches user's kubeconfig

### "Cannot start project - invalid status transition"

**Cause**: Project not in correct state for start

**Solution**:
1. Check current project status
2. Only STOPPED projects can be started
3. Wait for current operation to complete

### "Environment variables can only be updated when the project is running"

**Cause**: Project not in RUNNING state

**Solution**:
1. Check project status
2. Start project first
3. Wait for RUNNING status

### "Failed to create sandbox"

**Cause**: Various K8s errors

**Solution**:
1. Check K8s events: `kubectl describe statefulset`
2. Check resource quotas
3. Check image availability
4. Check namespace exists

## Performance Issues

### Slow API Responses

**Possible Causes**:
1. Database query performance
2. Missing indexes
3. N+1 query problem

**Solutions**:
```typescript
// Use include for relations
await prisma.project.findMany({
  include: { sandboxes: true, databases: true }
})

// Check query performance
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
})
```

### Slow Reconciliation

**Possible Causes**:
1. Too many resources to process
2. K8s API throttling
3. Lock contention

**Solutions**:
1. Reduce batch size in reconciliation job
2. Increase reconciliation interval
3. Check K8s API server load

### High Memory Usage

**Possible Causes**:
1. Memory leaks in event listeners
2. Large objects in memory
3. Unclosed connections

**Solutions**:
1. Check for memory leaks
2. Use streaming for large data
3. Close connections properly

### Slow Sandbox Startup

**Possible Causes**:
1. Large runtime image
2. Slow PVC provisioning
3. Resource constraints

**Solutions**:
1. Use smaller base image
2. Check storage class performance
3. Increase resource limits

## Related Documentation

- [Architecture](./architecture.md) - Reconciliation pattern and event system
- [Development Guide](./development.md) - Local development and code patterns
- [Operations Manual](./operations.md) - Deployment and K8s operations
