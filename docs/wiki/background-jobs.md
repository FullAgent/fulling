# Background Jobs

## Overview

Fulling uses cron-driven reconcile loops instead of blocking user requests on infrastructure work.

Startup wiring happens in:

- `instrumentation.ts`
- `lib/startup/index.ts`

On startup the app:

1. registers sandbox and database event listeners
2. starts reconcile jobs for sandboxes, databases, and project tasks

## Sandbox Reconcile

Source: `lib/jobs/sandbox/sandboxReconcile.ts`

Default behavior:

- interval: every 7 seconds
- batch size: 10 rows
- lock window: 5 seconds by default, with jitter

Eligible statuses:

- `CREATING`
- `STARTING`
- `STOPPING`
- `TERMINATING`
- `UPDATING`

The job atomically locks rows with `FOR UPDATE SKIP LOCKED`, then emits sandbox lifecycle events.

## Database Reconcile

Source: `lib/jobs/database/databaseReconcile.ts`

Default behavior:

- interval: every 11 seconds
- batch size: 10 rows
- lock window: 5 seconds by default, with jitter

Eligible statuses:

- `CREATING`
- `STARTING`
- `STOPPING`
- `TERMINATING`

The database listener performs Kubernetes cluster operations and backfills connection credentials when the database becomes ready.

## Project Task Reconcile

Source: `lib/jobs/project-task/projectTaskReconcile.ts`

Default behavior:

- interval: every 13 seconds
- batch size: 10 rows
- reconcile lock window: 5 seconds by default
- execution lock window: 300 seconds by default

Task orchestration logic includes:

- prerequisite checks
- state transitions into `WAITING_FOR_PREREQUISITES`
- attempt counting and retry behavior
- special handling for superseded skill installs and clone prerequisites

## Event Listener Behavior

### Sandbox Events

`lib/events/sandbox/sandboxListener.ts` handles:

- create
- start
- stop
- delete
- update

It also:

- merges project env and Anthropic env before sandbox create or update
- updates sandbox URLs after creation
- triggers runnable project tasks when a sandbox reaches `RUNNING`

### Database Events

`lib/events/database/databaseListener.ts` handles:

- create
- start
- stop
- delete

It also:

- fetches generated credentials once the cluster is ready
- updates project aggregate status after each transition

## Task Executors

Current executors under `lib/jobs/project-task/executors/` include:

- clone repository
- install skill
- uninstall skill

These executors use ttyd command execution inside the sandbox rather than direct Kubernetes file APIs.

## Why This Matters

This job model explains several user-visible behaviors:

- project start and stop requests return before Kubernetes work finishes
- imported projects can exist before the repository has actually been cloned
- environment variable writes set the runtime to `UPDATING` and settle later
- global skill changes fan out across projects asynchronously

## Constraints

- All jobs run in-process inside the Next.js server process, so initialization correctness matters.
- The model assumes eventual convergence rather than immediate completion.
- Locks and polling avoid thundering herd behavior, but the user experience still depends on repeated status refreshes.

