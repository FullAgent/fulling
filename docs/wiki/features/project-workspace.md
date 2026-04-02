# Project Workspace

## Purpose

This domain is the day-to-day operating surface for a project: runtime status, terminal access, optional database, and project-scoped configuration.

## User-Facing Surfaces

- `/projects` - project list and creation entry
- `/projects/[id]/terminal` - primary runtime view
- `/projects/[id]/database` - optional PostgreSQL surface
- `/projects/[id]/environment` - general env vars
- `/projects/[id]/secrets` - secret env vars
- `/projects/[id]/auth` - auth-related env templates
- `/projects/[id]/payment` - payment-related env templates

## Main Flows

- Create a blank project from the dashboard dialog.
- Open the workspace shell, where the terminal remains mounted across route changes.
- Start, stop, or delete the project by updating resource statuses and waiting for reconcile.
- Add a database later if the project does not already have one.
- Edit environment variables only while the project runtime is already running.

## Supporting APIs

- `GET /api/projects/[id]` - live project state
- `POST /api/projects/[id]/start` - request runtime start
- `POST /api/projects/[id]/stop` - request runtime stop
- `POST /api/projects/[id]/delete` - request project teardown
- `GET | POST /api/projects/[id]/environment` - grouped env read and create/batch replace
- `PUT | DELETE /api/projects/[id]/environment/[envId]` - individual env edits
- `GET /api/sandbox/[id]/cwd` - terminal working directory lookup
- `POST /api/sandbox/[id]/exec` - detached sandbox command execution

## Key Modules

- `app/(dashboard)/projects/(list)/page.tsx` - projects overview
- `app/(dashboard)/projects/[id]/layout.tsx` - workspace shell and auth gate
- `components/layout/project-content-wrapper.tsx` - persistent terminal/content split
- `hooks/use-project.ts` - live project polling
- `hooks/use-project-operations.ts` - start/stop/delete client helper
- `hooks/use-environment-variables.ts` - environment variable CRUD
- `lib/actions/project.ts` - create/import server actions
- `lib/actions/database.ts` - optional database actions

## Constraints

- `/projects/[id]` is just a redirect to the terminal page.
- Current UI logic assumes one primary sandbox and at most one practical database, even though the schema is more flexible.
- Environment writes are rejected unless all sandboxes are already `RUNNING`.

