# Development Guide

This document provides guidance for local development and code patterns.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [Development Commands](#development-commands)
- [Project Structure](#project-structure)
- [Code Patterns](#code-patterns)
- [Testing](#testing)
- [Debugging](#debugging)

## Prerequisites

- **Node.js**: 22.12.0 or higher
- **pnpm**: 9.x or higher
- **PostgreSQL**: 14.x or higher
- **Kubernetes cluster**: For full integration testing (optional)

## Getting Started

### 1. Clone and Install

```bash
git clone https://github.com/FullAgent/fulling.git
cd fulling
pnpm install
```

### 2. Environment Setup

Create `.env.local` file:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/fullstackagent"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-nextauth-secret"
AUTH_TRUST_HOST=""

# GitHub OAuth
GITHUB_CLIENT_ID="your-github-client-id"
GITHUB_CLIENT_SECRET="your-github-client-secret"

# Sealos OAuth (optional)
SEALOS_JWT_SECRET=""

# Kubernetes (optional for local dev)
RUNTIME_IMAGE="docker.io/limbo2342/fullstack-web-runtime:sha-ca2470e"

# Logging
LOG_LEVEL="info"
```

### 3. Database Setup

```bash
npx prisma generate
npx prisma db push
```

### 4. Start Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000)

## Development Commands

### Main Application

```bash
pnpm dev             # Start dev server on 0.0.0.0:3000
pnpm build           # Build for production
pnpm start           # Start production server on 0.0.0.0:3000
pnpm lint            # Run ESLint
pnpm lint:fix        # Auto-fix ESLint issues
```

### Database

```bash
npx prisma generate  # Generate Prisma client after schema changes
npx prisma db push   # Push schema to database (dev)
npx prisma studio    # Open database GUI
npx prisma migrate dev --name description  # Create migration
```

### Runtime Image

```bash
cd runtime
./build.sh           # Build Docker image locally
./push-to-dockerhub.sh  # Push to registry
```

## Project Structure

```
fulling/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   ├── projects/      # Project management
│   │   ├── sandbox/       # Sandbox operations
│   │   ├── user/          # User configuration
│   │   └── github/        # GitHub integration
│   ├── (landing)/         # Landing page
│   └── layout.tsx         # Root layout
│
├── components/            # React components
│   ├── ui/               # Shadcn/UI components
│   └── terminal/         # Terminal components
│
├── lib/                   # Core libraries
│   ├── k8s/              # Kubernetes managers
│   ├── events/           # Event system
│   ├── jobs/             # Background jobs
│   ├── repo/             # Repository layer
│   ├── services/         # Business services
│   └── util/             # Utilities
│
├── prisma/               # Database schema
│   └── schema.prisma
│
├── runtime/              # Docker image for sandboxes
│   ├── Dockerfile
│   ├── entrypoint.sh
│   └── ttyd-startup.sh
│
└── docs/                 # Documentation
```

## Code Patterns

### User-Specific K8s Service

**Always use this pattern** (never instantiate KubernetesService directly):

```typescript
import { getK8sServiceForUser } from '@/lib/k8s/k8s-service-helper'

// In API routes or event listeners
const k8sService = await getK8sServiceForUser(userId)

// Get managers
const sandboxManager = k8sService.getSandboxManager()
const databaseManager = k8sService.getDatabaseManager()
const namespace = k8sService.getDefaultNamespace()
```

### Non-Blocking API Endpoints

API endpoints should only update database, never wait for K8s operations:

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

### Event Listeners

```typescript
// lib/events/sandbox/sandboxListener.ts

async function handleCreateSandbox(payload: SandboxEventPayload): Promise<void> {
  const { user, project, sandbox } = payload

  if (sandbox.status !== 'CREATING') return

  try {
    const k8sService = await getK8sServiceForUser(user.id)
    await k8sService.getSandboxManager().createSandbox({...})
    await updateSandboxStatus(sandbox.id, 'STARTING')
    await projectStatusReconcile(project.id)
  } catch (error) {
    logger.error(`Failed to create sandbox: ${error}`)
    await updateSandboxStatus(sandbox.id, 'ERROR')
  }
}
```

### Error Handling

```typescript
try {
  await k8sOperation()
  await updateStatus('RUNNING')
} catch (error) {
  logger.error(`Operation failed: ${error}`)
  await updateStatus('ERROR')
  // Don't throw - let reconciliation retry
}
```

### Project Name Sanitization

```typescript
import { KubernetesUtils } from '@/lib/k8s/kubernetes-utils'

const k8sProjectName = KubernetesUtils.toK8sProjectName(projectName)
// Converts "My Blog!" → "myblog" (lowercase, alphanumeric, max 20 chars)
```

## Testing

### Local Testing

```bash
# 1. Start development server
pnpm dev

# 2. Create project via UI
# Open http://localhost:3000 and login

# 3. Check database
npx prisma studio
```

### Integration Testing

For full integration testing with Kubernetes:

1. Set up a Kubernetes cluster (e.g., Sealos, minikube)
2. Configure kubeconfig in UserConfig table
3. Test project creation flow

## Debugging

### Database Queries

```typescript
// Enable Prisma query logging
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
})
```

### Kubernetes Operations

```bash
# Set kubeconfig
export KUBECONFIG=/path/to/kubeconfig

# Check StatefulSets
kubectl get statefulsets -n {namespace}

# Check pods
kubectl get pods -n {namespace} -l app={statefulset-name}

# Pod logs
kubectl logs -n {namespace} {pod-name}

# Check KubeBlocks database
kubectl get cluster -n {namespace}

# Check ingresses
kubectl get ingress -n {namespace}
```

### Reconciliation Jobs

Check logs for reconciliation job execution:

```typescript
// Look for these log patterns:
// "Reconciliation job started"
// "Processing sandbox: {id}"
// "Sandbox {id} status changed to {status}"
```

### Event System

```typescript
// Enable event bus debug logging
import { sandboxEventBus } from '@/lib/events/sandbox/bus'

sandboxEventBus.on('CreateSandbox', (payload) => {
  console.log('CreateSandbox event received:', payload)
})
```

## Code Style

### TypeScript

- Use TypeScript strict mode
- Prefer type inference over explicit types
- Use `const` assertions for literal types

### React

- Use functional components with hooks
- Prefer composition over inheritance
- Use Shadcn/UI components

### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Files | kebab-case | `sandbox-manager.ts` |
| Components | PascalCase | `TerminalContainer.tsx` |
| Functions | camelCase | `getK8sServiceForUser` |
| Constants | UPPER_SNAKE_CASE | `DATABASE_URL` |
| Types | PascalCase | `SandboxStatus` |
| Enums | PascalCase | `ProjectStatus` |

### No Comments Policy

**Important**: Do not add comments unless explicitly requested. Code should be self-documenting through clear naming and structure.

## Related Documentation

- [Architecture](./architecture.md) - Reconciliation pattern and event system
- [API Reference](./api.md) - API endpoints and request/response formats
- [Database Schema](./database.md) - Prisma models and relationships
- [Operations Manual](./operations.md) - Deployment and K8s operations
- [Troubleshooting](./troubleshooting.md) - Common issues and debugging
