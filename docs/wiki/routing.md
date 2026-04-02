# Routing

## Routing Overview

Fulling uses the App Router only. The route tree is organized with route groups for landing, auth, and dashboard surfaces, plus a standalone GitHub callback page.

Route groups:

- `(landing)` - marketing and public entry surface
- `(auth)` - login and auth error views
- `(dashboard)` - authenticated application UI for projects, settings, and skills
- standalone `/github/app/callback` - popup-oriented GitHub App install completion page

No `middleware.ts` was found, so route access is enforced in server components and API helpers rather than global middleware.

## Layouts

### Root Layout

`app/layout.tsx` wraps the app in:

- `SessionProvider`
- `QueryClientProvider`
- `SealosProvider`
- `ThemeProvider`
- global toaster notifications

### Projects List Layout

`app/(dashboard)/projects/(list)/layout.tsx` renders:

- shared dashboard sidebar
- search bar
- projects list content

### Project Detail Layout

`app/(dashboard)/projects/[id]/layout.tsx` is the main workspace shell.

It:

- checks auth with `auth()`
- verifies the project belongs to the current user
- mounts a primary sidebar
- mounts a project-specific sidebar
- renders `ProjectContentWrapper`, which keeps the terminal mounted across navigation

### Settings Layout

`app/(dashboard)/settings/layout.tsx` renders the shared sidebar and a settings sidebar, then redirects the top-level settings page to `/settings/integrations`.

### Skills Layout

`app/(dashboard)/skills/layout.tsx` renders the shared dashboard sidebar and a single-column content area.

## App Routes

### Public and Pre-Auth Pages

- `/` - landing page with server-fetched GitHub star count
- `/login` - credentials and GitHub sign-in UI
- `/auth-error` - auth error view
- `/github/app/callback` - popup page that calls the API callback and posts a message back to the opener

### Dashboard Pages

- `/projects`
- `/projects/[id]`
  - redirects to `/projects/[id]/terminal`
- `/projects/[id]/terminal`
- `/projects/[id]/database`
- `/projects/[id]/environment`
- `/projects/[id]/secrets`
- `/projects/[id]/auth`
- `/projects/[id]/payment`
- `/projects/[id]/github`
- `/projects/[id]/exec-test`
- `/settings`
  - redirects to `/settings/integrations`
- `/settings/integrations`
- `/skills`

## API Routes

API routes live under `app/api/` and are documented in [API Index](./api/index.md).

Main route families:

- `/api/auth/[...nextauth]`
- `/api/github/app/*`
- `/api/projects/[id]/*`
- `/api/sandbox/[id]/*`
- `/api/user/config/*`

## Dynamic Segments

UI dynamic segments:

- `/projects/[id]`

API dynamic segments:

- `/api/auth/[...nextauth]`
- `/api/projects/[id]`
- `/api/projects/[id]/environment/[envId]`
- `/api/sandbox/[id]`

## Navigation by Domain

### Global Sidebar

The shared dashboard sidebar exposes links for:

- `/projects`
- `/skills`
- `/settings`

It also advertises additional surfaces that are not implemented as routes yet:

- `/mcp`
- `/templates`
- `/integrations`

### Project Sidebar

The project workspace sidebar is split into:

- Workspace
  - terminal
  - database
- Configuration
  - environment
  - secrets
  - auth
  - payment
  - GitHub

### Settings Sidebar

The settings sidebar links to:

- `/settings/integrations`
- `/settings/account` (currently unimplemented)

## Route-Level Constraints

- Project detail access is enforced in the project layout, not middleware.
- `/projects/[id]` is not a real overview page; it always redirects to the terminal page.
- `app/(dashboard)/projects/(list)/_components/project-actions-menu.tsx` still pushes to `/projects/[id]/settings`, but no such route exists. The actual project configuration pages are split across database, environment, secrets, auth, payment, and GitHub routes.
