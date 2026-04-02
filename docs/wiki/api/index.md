# API Index

## API Overview

The repository exposes internal application APIs rather than a broad external developer platform.

Main route families:

- auth and GitHub lifecycle
- projects and runtime control
- user-scoped configuration

All authenticated internal routes use App Router route handlers under `app/api/`.

## Public Interfaces

Public-facing route surfaces are limited to:

- `GET | POST /api/auth/[...nextauth]`
- `GET /api/github/app/callback`
- `POST /api/github/app/webhook`

Notes:

- The auth route is public because NextAuth owns its exchange protocol.
- The GitHub callback is reachable from an external install flow, but still requires an authenticated Fulling session to bind the installation to a user.
- The webhook is public but guarded by GitHub signature verification.

## Internal Interfaces

Internal route surfaces cover:

- project polling and lifecycle status changes
- project environment variable CRUD
- sandbox execution helpers
- user config storage and validation

These routes are primarily consumed by in-repo hooks and dialogs rather than third-party clients.

## Domain Index

- [Auth and GitHub](./auth-and-github.md)
- [Projects and Runtime](./projects-and-runtime.md)
- [User Config](./user-config.md)

## Notable Auth Gates

- `withAuth` in `lib/api-auth.ts` is the standard API wrapper.
- Ownership checks are performed per project or sandbox.
- No API-wide middleware layer was found.

