# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

## Project Overview

**Fulling v2** is an AI-powered development platform that integrates AI Agent ecosystem to provide full-stack development capabilities. Users can import existing projects from GitHub or create new projects directly on the platform.

**Core Value**: Free users' mental bandwidth through AI Agents. Users focus on development while Agents silently handle complex operations (deployment, infrastructure, etc.) without interruption.

**Key Features**:
- **Flexible Project Creation**: Import from GitHub repositories or create new projects from scratch
- **Optional Database**: Add PostgreSQL database on-demand when needed
- **AI Agent Ecosystem**: AI agents handle development, testing, deployment, and infrastructure management
- **Automated Operations**: Deployment, scaling, and infrastructure management happen automatically in the background
- **Full-Stack Development**: Complete environment with optional database, terminal, and file management
- **Zero Infrastructure Knowledge Required**: Users don't need to understand Kubernetes, networking, or DevOps

**Architecture**: The platform uses an **asynchronous reconciliation pattern** where API endpoints return immediately and background jobs sync desired state (database) with actual state (Kubernetes) every 3 seconds.

## Tech Stack

### Frontend
- Framework: Next.js 16 (App Router) + React 19
- Language: TypeScript
- Styling: Tailwind CSS v4
- UI Components: Shadcn/UI

### Backend
- Runtime: Node.js 22
- API: Next.js API Routes
- Database ORM: Prisma
- Authentication: NextAuth v5 (GitHub, Password, Sealos OAuth)

### Infrastructure
- Container Orchestration: Kubernetes
- Database: PostgreSQL (via KubeBlocks)
- Web Terminal: ttyd (HTTP Basic Auth)
- File Manager: FileBrowser

## Key Conventions

### Code Style
- Use TypeScript strict mode
- Always follow best practices
- Write self-documenting code: for complex functions, describe purpose, expected inputs, and expected outputs above the function
- In `lib/platform/`, prefer one primary action per file. Use noun directories and verb file names, and add a short boundary comment above the main exported function covering purpose, expected inputs/preconditions, expected outputs/guarantees, and what is out of scope.
- Use functional components with hooks

### Naming Conventions
- K8s resources: `{k8s-project-name}-{resource-type}-{6chars}`
- Environment variables: `UPPER_SNAKE_CASE`
- Database tables: PascalCase (Prisma models)
- API routes: kebab-case
- Files: kebab-case
- In `lib/platform/`, file names should usually be action-oriented verbs such as `create-project-with-sandbox`, `find-installation-repository`, or `get-user-default-namespace`, rather than vague names like `shared` or `helpers`.

### Component Organization
- **Route-specific components**: Place in `_components/` directory under the route folder
  - Use `_` prefix to prevent Next.js from treating it as a route
  - Example: `app/(dashboard)/settings/_components/github-status-card.tsx`
- **Shared components**: Place in top-level `components/` directory
  - Only for components used across multiple routes
  - Example: `components/ui/button.tsx`, `components/sidebar.tsx`

### Important Patterns

1. **Always use user-specific K8s service**:
   ```typescript
   const k8sService = await getK8sServiceForUser(userId)
   ```

2. **API endpoints are non-blocking**:
   - Only update database
   - Return immediately
   - Reconciliation jobs handle K8s operations

3. **Use optimistic locking**:
   - Repository layer handles locking automatically
   - Prevents concurrent updates

4. **Follow reconciliation pattern**:
   - API → Database → Reconciliation Job → Event → K8s Operation
   - Status updates happen asynchronously

## Key Design Decisions

### Why StatefulSet?
- Persistent storage for each pod
- Stable network identities
- Ordered pod deployment

### Why Reconciliation Pattern?
- Non-blocking API responses
- Automatic recovery from failures
- Consistent state management
- Easy to monitor and debug

### Why User-Specific Namespaces?
- Multi-tenancy isolation
- Resource quotas per user
- Separate kubeconfig per user
- No cross-user access

## Project Structure

```
Fulling/
├── app/                          # Next.js App Router
│   ├── api/                      # API Routes
│   ├── (auth)/                   # Auth pages
│   └── (dashboard)/projects/[id]/
│       └── _components/          # Route-specific components
│
├── components/                   # Shared components
├── hooks/                        # Client-side hooks
│
├── lib/
│   ├── data/                     # Server-side data access (for Server Components)
│   ├── actions/                  # Client-side data access (Server Actions)
│   ├── repo/                     # Repository layer with optimistic locking
│   ├── services/                 # Business logic services
│   ├── events/                   # Event bus and listeners
│   ├── jobs/                     # Reconciliation background jobs
│   ├── startup/                  # Application initialization
│   ├── k8s/                      # Kubernetes operations
│   └── util/                     # Utility functions
│
├── prisma/                       # Prisma schema
├── provider/                     # React Context providers
├── runtime/                      # Sandbox Docker image
└── yaml/                         # Kubernetes templates
```

**Key Directories**:
- `lib/data/` - Server-side data access, used by Server Components
- `lib/actions/` - Server Actions, used by Client Components
- `lib/repo/` - Repository with optimistic locking, used by Jobs/Events
- `lib/events/` + `lib/jobs/` - Core of reconciliation pattern
- `lib/startup/` - Initializes event listeners and reconciliation jobs

## Documentation Index

- [Architecture](./docs/architecture.md) - Reconciliation pattern, event system, state management
- [Development Guide](./docs/development.md) - Local development, code patterns, testing
- [Operations Manual](./docs/operations.md) - Deployment, monitoring, K8s operations
- [Troubleshooting](./docs/troubleshooting.md) - Common issues, debugging commands

## Quick Reference

### Development Commands
```bash
pnpm dev              # Start dev server
pnpm build            # Build for production
pnpm lint             # Run ESLint
npx prisma generate   # Generate Prisma client
npx prisma db push    # Push schema to database
```

### Key Files
- `lib/k8s/k8s-service-helper.ts` - User-specific K8s service
- `lib/events/sandbox/sandboxListener.ts` - Sandbox lifecycle handlers
- `lib/jobs/sandbox/sandboxReconcile.ts` - Sandbox reconciliation job
- `lib/events/database/databaseListener.ts` - Database lifecycle handlers
- `lib/jobs/database/databaseReconcile.ts` - Database reconciliation job
- `lib/actions/project.ts` - Project creation (creates Sandbox only)
- `lib/actions/database.ts` - Database creation/deletion (on-demand)
- `prisma/schema.prisma` - Database schema
- `instrumentation.ts` - Application startup

### Environment Variables
- `DATABASE_URL` - Main app database connection
- `NEXTAUTH_SECRET` - NextAuth secret
- `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` - GitHub OAuth
- `SEALOS_JWT_SECRET` - Sealos OAuth validation
- `RUNTIME_IMAGE` - Container image version

### Resource Status
- `CREATING` → `STARTING` → `RUNNING` ⇄ `STOPPING` → `STOPPED`
- `UPDATING` - Environment variables being updated
- `TERMINATING` → `TERMINATED`
- `ERROR` - Operation failed

### Port Exposure
- **3000**: Next.js application
- **7681**: ttyd web terminal
- **8080**: FileBrowser (file manager)

## Important Notes

- **Project Resources**: Each project includes a Sandbox (required) and can optionally have a Database (PostgreSQL). Database can be added on-demand after project creation.
- **Reconciliation Delay**: Status updates may take up to 3 seconds
- **User-Specific Namespaces**: Each user operates in their own K8s namespace
- **Frontend Polling**: Client components poll every 3 seconds for status updates
- **Database Wait Time**: PostgreSQL cluster takes 2-3 minutes to reach "Running" (when added)
- **Idempotent Operations**: All K8s methods can be called multiple times safely
- **Lock Duration**: Optimistic locks held for 30 seconds
- **Deployment Domain**: Main app listens on `0.0.0.0:3000` (not localhost) for Sealos
