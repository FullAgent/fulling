# Architecture

## Overview

Fulling splits responsibility between a Next.js interaction layer and a database-backed control plane.

At a high level:

1. App Router pages and client components collect user intent.
2. Internal APIs or server actions persist that intent in PostgreSQL through Prisma.
3. Reconcile jobs poll for records in transition states.
4. Event listeners call user-scoped Kubernetes or GitHub integrations.
5. Repository records are updated with the latest status, URLs, credentials, or task results.

## Repository Shape

- `app/`
  - App Router pages, route handlers, layouts, and route-local components.
- `components/`, `hooks/`, `provider/`
  - Client UI primitives, React Query hooks, session/theme/Sealos providers.
- `lib/actions/`
  - Server actions used by client components for project, database, GitHub, sandbox, and skill operations.
- `lib/data/`
  - Server-side read helpers for Server Components.
- `lib/api-auth.ts`
  - Shared API authorization and ownership checks.
- `lib/repo/`
  - Persistence helpers, lock acquisition, status reconciliation, and ownership-aware updates.
- `lib/events/` and `lib/jobs/`
  - In-process event buses and cron-driven reconciliation.
- `lib/platform/`
  - Newer control-plane layers: control, persistence, integrations, executors, and orchestrator scaffolding.
- `lib/k8s/` and `lib/services/`
  - Provider-facing runtime logic for Kubernetes, GitHub App, ttyd, and Anthropic proxy support.

## Runtime Boundaries

### UI Layer

The UI is App Router only. Server components gate authenticated routes and fetch initial data. Client components then handle interactive state, polling, forms, dialogs, and terminal UX.

Key modules:

- `app/layout.tsx` - root providers and global metadata
- `app/(dashboard)/projects/[id]/layout.tsx` - project ownership gate and persistent workspace shell
- `components/layout/project-content-wrapper.tsx` - persistent terminal panel plus route-driven content panel
- `components/dialog/settings-dialog.tsx` - user-scoped settings surface

### Server Layer

The server layer is split between internal API routes and server actions.

- Internal API routes are used for authenticated app behavior such as project polling, environment variable writes, sandbox command execution, and user config persistence.
- Server actions are used where the UI wants a direct write-side entrypoint without modeling a public route shape.

Key modules:

- `app/api/**/route.ts`
- `lib/actions/project.ts`
- `lib/actions/database.ts`
- `lib/actions/skill.ts`
- `lib/actions/github.ts`

### Control Plane

The control plane is responsible for durable intent, not immediate infrastructure effects.

- `lib/platform/control/commands/` accepts validated intent.
- `lib/platform/persistence/` creates the rows and queued task records needed to represent that intent.
- `lib/repo/` handles lower-level updates, row locking, and status aggregation.

Notable examples:

- `createProjectCommand` creates a project, sandbox metadata, and initial skill install tasks.
- `createProjectFromGitHubCommand` verifies repository access, creates the project, and queues a clone task.
- `createDatabaseCommand` creates the database control-plane row but does not create the database immediately.

### Reconcile and Event Layer

Background jobs poll for state transitions and emit typed events.

- `lib/jobs/sandbox/sandboxReconcile.ts`
- `lib/jobs/database/databaseReconcile.ts`
- `lib/jobs/project-task/projectTaskReconcile.ts`
- `lib/events/sandbox/sandboxListener.ts`
- `lib/events/database/databaseListener.ts`

This is the clearest expression of the repository's asynchronous reconciliation pattern.

## Core Request Paths

### Blank Project Creation

1. The create project dialog calls `createProject` in `lib/actions/project.ts`.
2. `createProjectCommand` validates the name, resolves the user's default namespace, and creates project and sandbox rows.
3. The sandbox starts in a transition state.
4. The sandbox reconcile job locks that row and emits sandbox lifecycle events.
5. The sandbox listener calls the user-scoped Kubernetes service and updates URLs and status.

### GitHub Import

1. The import dialog reads GitHub App installations and repositories through server actions.
2. `createProjectFromGitHubCommand` creates project and sandbox rows, then queues `CLONE_REPOSITORY`.
3. The task reconcile job waits for the sandbox to reach `RUNNING`.
4. The clone executor uses a GitHub App installation token and ttyd command execution to clone the repository inside the sandbox.

### Environment Variable Update

1. Project config pages use `useEnvironmentVariables` and `useBatchUpdateEnvironmentVariables`.
2. Internal API routes persist environment rows only when the project is already running.
3. Successful writes mark sandboxes as `UPDATING`.
4. Sandbox reconcile then reloads project and Anthropic env vars and pushes them into Kubernetes.

## Shared Libraries and Cross-Cutting Concerns

- Prisma is the only persistence layer in active use.
- `react` cache is used in `lib/data/` to deduplicate request-scoped reads.
- React Query is the main client cache for live project state.
- `lib/fetch-client.ts` wraps browser fetch with timeout and automatic `401` redirect handling.
- `instrumentation.ts` and `lib/startup/index.ts` ensure listeners and jobs are only initialized once per server process.

## External Dependencies

- PostgreSQL via Prisma
- Kubernetes through user-provided kubeconfig
- Sealos desktop SDK for iframe-aware bootstrap
- GitHub App OAuth, installation APIs, and webhook verification
- ttyd for remote shell execution inside sandboxes
- Anthropic-compatible proxy settings stored in user config and projected into sandboxes

## Constraints

- The control plane is mid-transition: `lib/platform/` introduces a cleaner layered structure, but legacy `lib/repo/`, `lib/services/`, and `lib/actions/` modules are still heavily used.
- The schema allows multiple sandboxes and databases per project, but the current UI usually treats the first sandbox and first database as the primary runtime surfaces.
- Some navigation targets exist in sidebars without implemented routes; see [Routing](./routing.md).

