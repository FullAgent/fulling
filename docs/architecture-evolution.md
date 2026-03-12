# Architecture Evolution

This document describes the intended next stage of Fulling's codebase evolution.

It is not a description of the current repository layout. It is the target direction for making the code structure match the system architecture more directly.

## Why Evolve

Fulling is no longer just a conventional web application.

It is a platform with:

- a database-backed control plane
- resource reconciliation for Kubernetes infrastructure
- project-level asynchronous task execution inside sandboxes
- multiple external integrations such as GitHub, ttyd, Kubernetes, and future deploy providers

As the system grows, a framework-shaped code layout stops matching the real mental model of the platform.

The goal of the next phase is to make the codebase express the system in the same terms we use to reason about it:

```text
Intent -> State -> Reconcile -> Effect
```

## Target Mental Model

The ideal architecture should be understandable as five layers:

1. Interaction Layer
2. Control State Layer
3. Orchestration Layer
4. Execution Layer
5. Integration Layer

A reader should be able to answer these questions quickly:

- Where does user intent enter the system?
- Where is that intent persisted as state?
- Which background mechanism advances that state?
- Which code actually performs the external effect?
- Which files encapsulate external system protocols?

## Target Architecture

### 1. Interaction Layer

Purpose:

- receive requests from users or clients
- parse input
- call control-plane commands or queries
- return responses

Examples:

- Next.js route handlers
- Server Actions
- UI entry components

This layer should not contain infrastructure lifecycle logic or long-running orchestration logic.

### 2. Control State Layer

Purpose:

- convert user intent into persisted state transitions
- define command and query use cases
- decide which records must be created or updated

Examples:

- create project
- import project from GitHub
- create database
- dispatch install-skill tasks
- dispatch deploy task

This layer is where the system decides what should happen, not where it actually performs it.

### 3. Orchestration Layer

Purpose:

- scan persisted state
- evaluate state machine transitions
- determine whether prerequisites are met
- claim work and advance it safely

Examples:

- sandbox reconcile
- database reconcile
- project task reconcile

This layer should own "when work is ready to run" and "what transition comes next."

### 4. Execution Layer

Purpose:

- perform the actual work after orchestration decides it should happen

Examples:

- create sandbox in Kubernetes
- stop database cluster
- clone repository inside sandbox
- install skill in sandbox
- deploy project

This layer should be effectful, explicit, and easy to test in isolation.

### 5. Integration Layer

Purpose:

- isolate external system protocol details from internal orchestration and domain logic

Examples:

- GitHub App token exchange and installation APIs
- ttyd command execution
- Kubernetes service and managers
- deploy provider clients
- AI proxy integration

This layer should be the only place that knows provider-specific protocol details.

## Ideal Repository Shape

The repository should gradually move toward something like this:

```text
app/
  Framework entrypoints only

lib/
  domain/
  control/
    commands/
    queries/
  persistence/
  orchestrators/
    resources/
    tasks/
  executors/
    k8s/
    sandbox/
    deploy/
  integrations/
    github/
    ttyd/
    k8s/
    aiproxy/
  policies/
  shared/
```

This is not a requirement to rename everything immediately. It is the target shape that best matches the architecture.

## What Each Target Area Means

### `app/`

Should contain:

- routes
- pages
- route-local UI composition
- request parsing
- response shaping

Should not be the place where major platform logic lives.

### `lib/domain/`

Should contain:

- state semantics
- status aggregation rules
- lifecycle definitions
- prerequisite evaluation logic
- domain types and invariants

Typical examples:

- project status aggregation
- task prerequisite rules
- lifecycle transition rules

### `lib/platform/control/`

Should contain:

- application commands
- application queries
- user-intent entrypoints that are independent from framework details

Typical examples:

- `create-project`
- `import-project-from-github`
- `dispatch-install-skill-for-user-projects`
- `get-project-list`

This is the layer that turns interaction into durable state changes.

### `lib/persistence/`

Should contain:

- database access
- row claiming
- lock management
- state transition persistence

This corresponds closely to what `lib/repo/` does today, but with a name that better reflects its role in a control-plane system.

### `lib/orchestrators/`

Should contain:

- reconcile loops
- transition selection
- scheduling logic
- wake-up logic for resource or task processing

This layer is currently spread across `jobs/` and `events/`.

Long term, the code should make it easy to inspect one workflow in one place, instead of hopping across multiple implementation-mechanism directories.

### `lib/executors/`

Should contain:

- effectful operations triggered by orchestrators

Examples:

- Kubernetes resource actions
- sandbox command execution
- deployment actions

The key separation is:

- orchestrators decide whether to run
- executors perform the work

### `lib/integrations/`

Should contain:

- provider-specific APIs
- transport/protocol code
- external authentication/token exchange

This is especially important because `services/` and `util/` currently mix together:

- true business services
- external adapters
- generic helpers

That mixing increases cognitive load.

## Structural Rules For The Next Phase

### Rule 1: Keep resource plane and task plane distinct

Resource lifecycle and project task execution are related but not the same.

- `Sandbox` and `Database` belong to the resource plane
- `ProjectTask` belongs to the task plane

They should not collapse into a single generic abstraction too early.

### Rule 2: Prefer architecture-shaped names over framework-shaped names

Names should describe system role, not just invocation style.

Examples:

- better: `control`, `orchestrators`, `integrations`, `executors`
- weaker: `services`, `util`, `helpers`

### Rule 3: Polling remains the correctness mechanism

Wake-up triggers are useful, but background reconcile loops remain the source of truth.

The architecture should continue to optimize for recoverability, not only low latency.

### Rule 4: State machines should remain explicit

If work needs to resume later, it should be represented in persisted state.

Avoid moving important lifecycle meaning into hidden in-memory logic.

### Rule 5: Reorganization should follow system boundaries, not file count

The purpose of the reorganization is not aesthetic.

It is to make the codebase reflect the platform's actual conceptual boundaries:

- intent handling
- persisted state
- orchestration
- execution
- external integration

## Suggested Migration Strategy

The next phase should be gradual.

### Phase 1: Clarify naming and ownership

Goals:

- continue building `ProjectTask` as the task-plane abstraction
- reduce ambiguous use of `services/` and `util/`
- document system ownership by layer

Low-risk changes:

- move external adapters toward `integrations/`
- move business rules toward `domain/` or `policies/`
- introduce command/query naming for control-plane operations

### Phase 2: Reshape orchestration boundaries

Goals:

- make workflows easier to inspect end-to-end
- reduce mental jumps between job and listener implementations

Likely work:

- make resource orchestration more visibly grouped
- make task orchestration more visibly grouped
- separate transition logic from executor logic more explicitly

### Phase 3: Unify platform patterns where appropriate

Goals:

- reduce duplicated scheduling and transition mechanics
- strengthen task dependency and execution models

Examples:

- generalized task prerequisite evaluation
- shared orchestration helpers for claiming and transition persistence
- richer task types such as deploy, install skill, uninstall skill

This phase should happen only after the architecture is clearly expressed in the codebase.

## What "Success" Looks Like

The reorganization is successful when the following are true:

- a new engineer can trace a major flow without guessing layer ownership
- resource lifecycles are easy to inspect in one conceptual area
- task execution flows are easy to inspect in one conceptual area
- external provider code is clearly separated from domain and orchestration code
- adding a new task type does not require inventing a new architectural path

## Current Direction

The current `ProjectTask` introduction is the first concrete move in this direction.

It shifts GitHub import from a project-specific status track into a reusable task-plane abstraction.

That same direction should guide the next structural changes:

- task types should grow through the task plane
- external adapters should become more explicit
- orchestration should become easier to inspect
- the repository layout should increasingly mirror the architecture itself
