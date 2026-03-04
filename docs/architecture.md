# Architecture Design Document

This document describes the architecture of FullstackAgent, an AI-powered cloud development platform.

## Table of Contents

- [Overview](#overview)
- [Reconciliation Pattern](#reconciliation-pattern)
- [System Layers](#system-layers)
- [Event System](#event-system)
- [State Management](#state-management)
- [Resource Lifecycle](#resource-lifecycle)
- [Key Design Decisions](#key-design-decisions)

## Overview

FullstackAgent creates isolated Kubernetes sandbox environments for full-stack development. Each project gets:

- **Sandbox Container**: Next.js + Claude Code CLI + ttyd terminal + FileBrowser
- **PostgreSQL Database**: Dedicated KubeBlocks cluster
- **Live Domains**: HTTPS subdomains for app, terminal, and file browser

### Core Principle: Asynchronous Reconciliation

The platform uses an **asynchronous reconciliation pattern** where:

1. API endpoints return immediately (non-blocking)
2. Background jobs sync desired state (database) with actual state (Kubernetes)
3. Event listeners execute K8s operations
4. Status updates happen asynchronously

```
User Request → API updates DB (status=CREATING) → Returns immediately (< 50ms)
                     ↓
         Reconciliation Job (every 3s)
                     ↓
         Emit Events → Listeners execute K8s ops
                     ↓
         Update status: CREATING → STARTING → RUNNING
                     ↓
         Frontend polls for updates
```

## Reconciliation Pattern

### Why Reconciliation?

Traditional approach (blocking API):
- API waits for K8s operations (30+ seconds)
- User sees loading spinner
- Timeout errors common
- Hard to recover from failures

Reconciliation approach (non-blocking):
- API returns immediately (< 50ms)
- Background jobs handle K8s operations
- Automatic retry on failures
- Easy to monitor and debug

### Flow Example

```
1. User clicks "Create Project"
   POST /api/projects { name: "my-blog" }

2. API creates database records immediately
   Project: status=CREATING
   Sandbox: status=CREATING
   Database: status=CREATING

3. Reconciliation job runs (every 3s)
   - Query: SELECT * FROM Sandbox WHERE status='CREATING' AND lockedUntil IS NULL
   - Locks sandbox (optimistic locking)
   - Emits CreateSandbox event

4. Event listener executes
   - Gets user-specific K8s service
   - Creates StatefulSet, Service, Ingresses
   - Updates status: CREATING → STARTING

5. Next cycle checks K8s status
   - If RUNNING: Update status to RUNNING
   - Aggregate project status from child resources
```

### Optimistic Locking

Prevents concurrent updates to the same resource:

```typescript
// Repository layer automatically handles locking
const lockedSandboxes = await acquireAndLockSandboxes(10)
// Only returns sandboxes where lockedUntil IS NULL OR < NOW()
// Sets lockedUntil = NOW() + 30 seconds atomically
```

Lock duration: 30 seconds (configurable)

## System Layers

### Layer 1: Control Plane (Main App)

- **Framework**: Next.js 16 (App Router) + React 19
- **Authentication**: NextAuth v5 (GitHub, Password, Sealos OAuth)
- **Database**: Prisma ORM → PostgreSQL
- **Responsibilities**:
  - Manages projects, users, environment variables
  - Does NOT directly execute K8s operations
  - Only updates database

### Layer 2: Reconciliation System

- **Background Jobs**: `lib/jobs/sandbox/`, `lib/jobs/database/`
- **Event System**: `lib/events/sandbox/`, `lib/events/database/`
- **Repository Layer**: `lib/repo/` with optimistic locking
- **Status Aggregation**: `lib/util/projectStatus.ts`

### Layer 3: Kubernetes Managers

- **SandboxManager**: `lib/k8s/sandbox-manager.ts` - StatefulSet operations
- **DatabaseManager**: `lib/k8s/database-manager.ts` - KubeBlocks operations
- **K8sServiceHelper**: `lib/k8s/k8s-service-helper.ts` - User-specific service factory
- **All operations are idempotent and non-blocking**

### Layer 4: Kubernetes Orchestration

- **Platform**: Sealos (usw.sealos.io)
- **Namespaces**: Each user operates in their own namespace
- **Resources per project**:
  - 1 StatefulSet (sandbox)
  - 1 Service
  - 3 Ingresses (app, terminal, filebrowser)
  - 1 PostgreSQL cluster (KubeBlocks)

### Layer 5: Runtime Containers

- **Image**: `limbo2342/fullstack-web-runtime:sha-ca2470e`
- **Base**: Ubuntu 24.04 + Node.js 22.x
- **Includes**:
  - Claude Code CLI
  - ttyd (web terminal with HTTP Basic Auth)
  - FileBrowser (web file manager)
  - Next.js, Prisma, PostgreSQL client
  - Buildah (rootless container builds)

## Event System

### Event Bus

Each resource type has its own event bus:

```typescript
// lib/events/sandbox/bus.ts
export const enum Events {
  CreateSandbox = 'CreateSandbox',
  StartSandbox = 'StartSandbox',
  StopSandbox = 'StopSandbox',
  DeleteSandbox = 'DeleteSandbox',
  UpdateSandbox = 'UpdateSandbox',
}

export const sandboxEventBus = new EventEmitter()
```

### Event Listeners

Listeners are registered at application startup:

```typescript
// lib/events/sandbox/sandboxListener.ts
export function registerSandboxListeners(): void {
  on(Events.CreateSandbox, handleCreateSandbox)
  on(Events.StartSandbox, handleStartSandbox)
  on(Events.StopSandbox, handleStopSandbox)
  on(Events.DeleteSandbox, handleDeleteSandbox)
  on(Events.UpdateSandbox, handleUpdateSandbox)
}

// Auto-register when module is imported
registerSandboxListeners()
```

### Event Handler Pattern

```typescript
async function handleCreateSandbox(payload: SandboxEventPayload): Promise<void> {
  const { user, project, sandbox } = payload

  if (sandbox.status !== 'CREATING') return

  try {
    const k8sService = await getK8sServiceForUser(user.id)
    await k8sService.getSandboxManager().createSandbox({...})
    await updateSandboxStatus(sandbox.id, 'STARTING')
    await projectStatusReconcile(project.id)
  } catch (error) {
    await updateSandboxStatus(sandbox.id, 'ERROR')
  }
}
```

## State Management

### Resource Status

Individual resources (Sandbox, Database) have these states:

| Status | Description |
|--------|-------------|
| `CREATING` | K8s resource being initially created |
| `STARTING` | Transitioning from STOPPED to RUNNING |
| `RUNNING` | Active and operational |
| `STOPPING` | Transitioning from RUNNING to STOPPED |
| `STOPPED` | Paused (replicas=0) |
| `UPDATING` | Environment variables being updated |
| `TERMINATING` | Being deleted from K8s |
| `TERMINATED` | Deleted from K8s (soft delete in DB) |
| `ERROR` | Encountered an error |

### Project Status Aggregation

Project status is **aggregated** from child resources:

**Priority order**:
1. **ERROR** - At least one resource has ERROR
2. **CREATING** - At least one resource has CREATING
3. **UPDATING** - At least one resource has UPDATING
4. **Pure states** - All same status → use that status
5. **Transition states**:
   - STARTING: All ∈ {RUNNING, STARTING}
   - STOPPING: All ∈ {STOPPED, STOPPING}
   - TERMINATING: All ∈ {TERMINATED, TERMINATING}
6. **PARTIAL** - Inconsistent mixed states (manual intervention needed)

```typescript
// lib/util/projectStatus.ts
export function aggregateProjectStatus(
  sandboxes: Sandbox[],
  databases: Database[]
): ProjectStatus {
  // Implementation follows priority rules above
}
```

## Resource Lifecycle

### Sandbox Lifecycle

```
CREATING → STARTING → RUNNING ⇄ STOPPING → STOPPED
    ↓          ↓         ↓         ↓
    └──────────┴─────────┴─────────→ ERROR
                                              ↓
                                    TERMINATING → TERMINATED
```

**Transitions**:
- `CREATING → STARTING`: K8s resources created
- `STARTING → RUNNING`: Pod ready
- `RUNNING → STOPPING`: Stop requested
- `STOPPING → STOPPED`: Pod terminated
- `STOPPED → STARTING`: Start requested
- `Any → ERROR`: Operation failed
- `Any → TERMINATING`: Delete requested
- `TERMINATING → TERMINATED`: K8s resources deleted

### Database Lifecycle

Same as Sandbox, but for KubeBlocks PostgreSQL clusters.

### Environment Variable Updates

When environment variables change:

```
RUNNING → UPDATING → STARTING → RUNNING
```

1. Status changes to UPDATING
2. StatefulSet spec updated (triggers pod restart)
3. Status changes to STARTING
4. Pod restarts with new env vars
5. Status changes to RUNNING

## Key Design Decisions

### Why StatefulSet instead of Deployment?

**StatefulSet benefits**:
- **Persistent storage**: Each pod gets its own PVC
- **Stable network identities**: Predictable pod names
- **Ordered deployment**: Graceful startup/shutdown
- **Stateful apps**: Better for databases, caches

**Trade-offs**:
- Slightly slower scaling
- More complex updates

### Why Reconciliation Pattern?

**Benefits**:
- Non-blocking API responses
- Automatic recovery from failures
- Consistent state management
- Easy to monitor and debug
- Idempotent operations

**Trade-offs**:
- Eventual consistency (up to 3s delay)
- More complex architecture

### Why HTTP Basic Auth for ttyd?

**Previous approach**: Custom authentication script
- Required maintaining shell script
- Complex session management
- Login popup in browser

**Current approach**: HTTP Basic Auth (ttyd native)
- No custom scripts needed
- URL-based authentication: `?authorization=base64(user:password)`
- Seamless browser integration
- No login popup

### Why FileBrowser Integration?

**Benefits**:
- Web-based file management
- Drag & drop file upload
- TUS protocol for large files
- Session tracking for cwd detection
- No additional authentication (uses own credentials)

### Why User-Specific Namespaces?

**Benefits**:
- Multi-tenancy isolation
- Resource quotas per user
- Separate kubeconfig per user
- No cross-user access

**Implementation**:
- Kubeconfig stored in `UserConfig` table
- Loaded via `getK8sServiceForUser(userId)`
- Each user operates in their own namespace

## Related Documentation

- [API Reference](./api.md) - API endpoints and request/response formats
- [Database Schema](./database.md) - Prisma models and relationships
- [Development Guide](./development.md) - Local development and code patterns
- [Operations Manual](./operations.md) - Deployment and K8s operations
- [Troubleshooting](./troubleshooting.md) - Common issues and debugging
