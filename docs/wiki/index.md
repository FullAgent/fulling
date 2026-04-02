# Fulling Wiki

## Project Summary

Fulling is a single-repo Next.js application for creating and operating AI-assisted development sandboxes. A project always starts with a sandbox runtime and can optionally add a PostgreSQL database later. GitHub App installation, repository import, runtime control, and global skill rollout all hang off that core project model.

The codebase combines a conventional App Router UI with a control plane that persists intent in PostgreSQL and lets background reconcile jobs bring Kubernetes resources into the expected state.

## Current Routing Mode

- Router mode: `app`
- UI routes live under `app/`
- API routes live under `app/api/`
- No Pages Router UI surface was found
- No `middleware.ts` was found

See [Routing](./routing.md) for the route map and layout structure.

## Main Business Domains

- [Auth and Identity](./features/auth-and-identity.md)
- [Project Workspace](./features/project-workspace.md)
- [GitHub and Import](./features/github-and-import.md)
- [User Settings](./features/user-settings.md)
- [Global Skills](./features/global-skills.md)

## Main Runtime Surfaces

- UI and layouts: App Router pages under `app/`
- Internal API surface: authenticated route handlers under `app/api/`
- Server actions: write-side entrypoints under `lib/actions/`
- Control plane commands: durable intent handling under `lib/platform/control/commands/`
- Reconcile jobs and listeners: `lib/jobs/` and `lib/events/`
- External integrations: Kubernetes, Sealos, GitHub App, ttyd, and Anthropic proxy support

## Wiki Map

- [Architecture](./architecture.md)
- [Routing](./routing.md)
- [Rendering and Data Flow](./rendering-and-data-flow.md)
- [Auth and State](./auth-and-state.md)
- [Config and Env](./config-and-env.md)
- [Data Models](./data-models.md)
- [Integrations](./integrations.md)
- [Background Jobs](./background-jobs.md)
- [TODO](./todo.md)
- [API Index](./api/index.md)
