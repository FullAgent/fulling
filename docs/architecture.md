# Architecture

This document describes the current runtime architecture of Fulling and the roles of the major subsystems in the repository.

## Overview

Fulling is a database-driven control plane for project sandboxes.

The system is organized around three ideas:

1. User-facing code records intent in PostgreSQL.
2. Background reconcile jobs read persisted state and advance it asynchronously.
3. External effects happen through two execution layers:
   - Kubernetes resource control for sandboxes and databases
   - Project task execution inside ready sandboxes

This is not a request/response system that blocks on infrastructure. It is an asynchronous state-convergence system.

## High-Level Model

There are three major domains:

- Control plane
  - Next.js pages, Server Actions, and API routes
  - Authentication and authorization
  - Prisma models as the source of truth
- Resource plane
  - `Sandbox` and `Database` lifecycle management
  - Kubernetes operations through user-scoped services
- Task plane
  - `ProjectTask` records for project-level asynchronous work
  - Current use case: clone a GitHub repository into a sandbox
  - Future use cases: install skill, uninstall skill, deploy project

At a high level:

```text
User action
-> App code validates and writes desired state to DB
-> Reconcile jobs scan DB for records in transitional states
-> Event listeners / task executors perform external work
-> Resource/task state is updated in DB
-> UI polls and reflects the latest state
```

## Repository Structure

```text
app/
  UI routes, API routes, and route-local components

components/
  Shared UI components

lib/actions/
  Server Actions called from client components

lib/data/
  Server-side data access for React Server Components

lib/repo/
  Persistence helpers, locking, and state transitions

lib/jobs/
  Background reconcile loops

lib/events/
  Resource event buses and listeners

lib/k8s/
  User-scoped Kubernetes service and managers

lib/services/
  Cross-cutting services and task dispatch helpers

lib/util/
  Aggregation, ttyd execution, formatting, and helpers

prisma/
  Prisma schema and migrations
```

## Core Runtime Layers

### 1. User Interaction Layer

Primary locations:

- `app/`
- `lib/actions/`
- `lib/data/`

Responsibilities:

- Authenticate the user
- Validate inputs
- Decide whether an operation is allowed
- Write the resulting state to the database
- Return immediately without waiting on Kubernetes or long-running sandbox work

Examples:

- Create new project
  - create `Project`
  - create `Sandbox`
  - create built-in environment variables
- Import from GitHub
  - create `Project`
  - create `Sandbox`
  - create a `ProjectTask` of type `CLONE_REPOSITORY`
- Add database
  - create `Database` with status `CREATING`
- Update environment variables
  - persist environment changes
  - mark running sandboxes as `UPDATING`

### 2. State Persistence Layer

Primary locations:

- `prisma/schema.prisma`
- `lib/repo/`

The database is the durable control plane.

The key models are:

- `Project`
  - project metadata
  - aggregated project status
  - optional GitHub repository metadata
- `Sandbox`
  - sandbox lifecycle state
  - URLs and runtime resource configuration
- `Database`
  - PostgreSQL lifecycle state
  - connection credentials once ready
- `Environment`
  - project-scoped environment variables
- `ProjectTask`
  - project-level asynchronous work
  - payload, result, retries, and locks
- `GitHubAppInstallation`
  - GitHub App installation ownership and permissions

The repository layer is where row locking and state transitions are centralized.

## Resource Plane

The resource plane manages infrastructure resources that exist independently in Kubernetes.

### Sandbox Lifecycle

Primary files:

- `lib/jobs/sandbox/sandboxReconcile.ts`
- `lib/events/sandbox/sandboxListener.ts`
- `lib/repo/sandbox.ts`
- `lib/k8s/sandbox-manager.ts`

States:

- `CREATING`
- `STARTING`
- `RUNNING`
- `UPDATING`
- `STOPPING`
- `STOPPED`
- `TERMINATING`
- `TERMINATED`
- `ERROR`

Flow:

```text
Sandbox.status = CREATING
-> sandbox reconcile job locks the row
-> emits CreateSandbox
-> listener creates K8s resources and writes ingress URLs
-> Sandbox.status = STARTING
-> later reconcile checks K8s status
-> Sandbox.status = RUNNING
```

Environment updates reuse the same mechanism:

```text
Environment changed
-> running sandboxes marked UPDATING
-> update sandbox env vars in Kubernetes
-> pod restarts if needed
-> sandbox returns to STARTING or RUNNING
```

### Database Lifecycle

Primary files:

- `lib/jobs/database/databaseReconcile.ts`
- `lib/events/database/databaseListener.ts`
- `lib/repo/database.ts`
- `lib/k8s/database-manager.ts`

States:

- `CREATING`
- `STARTING`
- `RUNNING`
- `STOPPING`
- `STOPPED`
- `TERMINATING`
- `TERMINATED`
- `ERROR`

Flow:

```text
Database.status = CREATING
-> database reconcile job locks the row
-> emits CreateDatabase
-> listener creates KubeBlocks cluster
-> Database.status = STARTING
-> later reconcile checks cluster status
-> credentials are fetched
-> Database.status = RUNNING
```

### Project Status Aggregation

Primary file:

- `lib/util/projectStatus.ts`

`Project.status` is derived from child resource states. It is not the main driver of work.

Priority order:

1. `ERROR`
2. `CREATING`
3. `UPDATING`
4. all resources equal the same stable state
5. consistent mixed transitions:
   - `{RUNNING, STARTING}` -> `STARTING`
   - `{STOPPED, STOPPING}` -> `STOPPING`
   - `{TERMINATED, TERMINATING}` -> `TERMINATING`
6. otherwise `PARTIAL`

When a project has no remaining resources, the project and its environments are deleted.

## Task Plane

The task plane manages project-level work that happens after a sandbox is ready.

Primary files:

- `lib/jobs/project-task/projectTaskReconcile.ts`
- `lib/jobs/project-task/executors/`
- `lib/repo/project-task.ts`
- `lib/services/project-task-dispatcher.ts`

### Current Task Types

- `CLONE_REPOSITORY`
- `INSTALL_SKILL`
- `UNINSTALL_SKILL`
- `DEPLOY_PROJECT`

Only `CLONE_REPOSITORY` is implemented today.

### Task States

- `PENDING`
- `WAITING_FOR_PREREQUISITES`
- `RUNNING`
- `SUCCEEDED`
- `FAILED`
- `CANCELLED`

### Task Flow

```text
User imports a GitHub repository
-> app creates Project + Sandbox
-> app creates ProjectTask(type=CLONE_REPOSITORY, status=WAITING_FOR_PREREQUISITES)
-> sandbox reaches RUNNING
-> task reconcile sees prerequisites are now satisfied
-> task executor runs git clone inside the sandbox through ttyd
-> task becomes SUCCEEDED or FAILED
```

Task execution data lives in:

- `payload`
  - executor input, such as repo metadata or skill id
- `result`
  - executor output, such as imported path
- `error`
  - terminal error message for failed tasks

## Polling and Triggering

The system uses both polling and direct wake-up triggers.

### Polling

Background jobs continuously scan the database:

- sandbox reconcile job
- database reconcile job
- project task reconcile job

This is the correctness mechanism.

### Direct wake-up triggers

Some transitions accelerate work without replacing polling.

Example:

- when a sandbox becomes `RUNNING`, sandbox listeners call `triggerRunnableTasksForProject(projectId)`

This reduces latency, but correctness still depends on periodic reconcile loops.

## Locking Model

The system uses database-based optimistic coordination, not an external queue.

Patterns:

- resource rows (`Sandbox`, `Database`) have `lockedUntil`
- task rows (`ProjectTask`) also have `lockedUntil`
- reconcile queries atomically select and lock eligible rows
- row-level transitions are updated in repo helpers

This avoids duplicate processing across concurrent app instances.

## Kubernetes Integration

Primary file:

- `lib/k8s/k8s-service-helper.ts`

Rule:

- always obtain Kubernetes access through `getK8sServiceForUser(userId)`

Why:

- each user has a user-scoped kubeconfig
- each user operates in a separate namespace
- the app should never perform cluster operations without user scoping

Kubernetes resources currently managed per project:

- one sandbox StatefulSet
- one sandbox Service
- three sandbox Ingresses
- optional PostgreSQL cluster through KubeBlocks

## GitHub Integration

Primary files:

- `lib/actions/github.ts`
- `lib/services/github-app.ts`
- `app/api/github/app/callback/route.ts`

The system uses GitHub App installations, not anonymous repository access.

Import flow:

1. user installs GitHub App
2. installation is recorded in `GitHubAppInstallation`
3. user chooses a repository in the import dialog
4. import action verifies repository access against the installation
5. project creation creates a clone task
6. task executor clones the repo into the sandbox using an installation token

## Design Rules

### Non-blocking control plane

User-facing endpoints should write desired state and return. They should not block on Kubernetes creation or long sandbox operations.

### State machines over ad hoc branching

If the system needs to resume work later, represent that as persisted state instead of in-memory flags.

### Resource plane and task plane stay separate

Use resource states for infrastructure lifecycle.
Use project tasks for asynchronous work that runs on top of ready infrastructure.

### Polling is the source of truth

Event-triggered wake-ups are an optimization. Reconcile jobs remain the primary correctness mechanism.

## Current End-to-End Flows

### New project

```text
Create project
-> Project.status = CREATING
-> Sandbox.status = CREATING
-> sandbox reconcile creates and starts sandbox
-> Sandbox.status = RUNNING
-> Project.status aggregates to RUNNING
```

### Import from GitHub

```text
Import from GitHub
-> Project + Sandbox created
-> ProjectTask(CLONE_REPOSITORY) created
-> sandbox reconcile drives sandbox to RUNNING
-> project task reconcile runs clone executor
-> task becomes SUCCEEDED or FAILED
-> project remains usable regardless of task outcome
```

### Add database

```text
Create database
-> Database.status = CREATING
-> database reconcile creates cluster
-> Database.status = STARTING
-> credentials become available
-> Database.status = RUNNING
```

### Deploy project

Planned path:

```text
User requests deploy
-> create ProjectTask(type=DEPLOY_PROJECT)
-> task reconcile waits for prerequisites
-> deploy executor performs deployment work
```

## When To Update This Document

Update this document whenever one of the following changes:

- a new persisted state machine is introduced
- resource lifecycle semantics change
- a new task type is added
- ownership of a subsystem moves to a different directory
- project-level work stops being sandbox-based
