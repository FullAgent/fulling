# Data Models

## Overview

Prisma models in `prisma/schema.prisma` describe both user identity and control-plane state. The main design split is:

- user-scoped identity and configuration
- project-scoped runtime resources
- queued asynchronous task state

## Identity and User Config

### `User`

Top-level owner for:

- identities
- projects
- user config
- global skills
- GitHub App installations

### `UserIdentity`

Represents external auth identities and sensitive metadata.

Current providers:

- `PASSWORD`
- `GITHUB`
- `SEALOS`

Metadata stores provider-specific details such as password hashes, OAuth tokens, or Sealos kubeconfig.

### `UserConfig`

Stores user-scoped settings such as:

- kubeconfig
- Anthropic proxy values
- system prompt

The model includes `category` and `isSecret` so the UI can group and mask values.

## GitHub Integration

### `GitHubAppInstallation`

Tracks GitHub App installation ownership and status.

Important fields:

- `installationId`
- account metadata
- repository selection mode
- permissions and subscribed events
- lifecycle status: `ACTIVE`, `SUSPENDED`, `DELETED`

Projects can reference a selected installation.

## Project and Runtime Resources

### `Project`

The top-level application object.

Important fields:

- display metadata
- legacy `githubRepo`
- newer GitHub App-backed repository metadata
- aggregated `status`

Relations:

- environments
- databases
- sandboxes
- project tasks

### `Environment`

Per-project key/value configuration rows. These are not independent runtime resources and have no lifecycle status.

### `Sandbox`

Represents the runtime workspace.

Important fields:

- Kubernetes namespace and sandbox name
- public app URL
- ttyd URL
- file browser URL
- runtime image and resource requests
- resource lifecycle status
- optimistic lock window

### `Database`

Represents the optional PostgreSQL cluster for a project.

Important fields:

- Kubernetes namespace and database name
- connection credentials and URL
- resource lifecycle status
- optimistic lock window

## Global Skills and Async Tasks

### `UserSkill`

Represents globally enabled skills for a user.

The current UI exposes a catalog-backed global desired state rather than project-local toggles.

### `ProjectTask`

Represents asynchronous work such as:

- `CLONE_REPOSITORY`
- `INSTALL_SKILL`
- `UNINSTALL_SKILL`
- `DEPLOY_PROJECT`

Important fields:

- `status`
- `triggerSource`
- `payload`
- `result`
- `attemptCount`
- `maxAttempts`
- lock and timing fields

## Status Models

### Resource Status

Used by sandboxes and databases:

- `CREATING`
- `STARTING`
- `RUNNING`
- `STOPPING`
- `STOPPED`
- `TERMINATING`
- `TERMINATED`
- `ERROR`
- `UPDATING`

### Project Status

Derived from child resource states rather than independently authored.

This lets project status reflect mixed runtime conditions such as:

- creating
- starting
- stopping
- terminating
- error
- partial

## Important Semantics

- Projects can be deleted automatically when all child runtime resources are gone and aggregate to `TERMINATED`.
- The schema allows more than one sandbox or database per project, but current UI flows usually operate on the first sandbox and the first database.
- Task execution is resilient rather than strictly synchronous; retries and prerequisite waiting are first-class concerns in the model.

