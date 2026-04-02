# Rendering and Data Flow

## Rendering Model

The repository mixes Server Components for routing, access control, and initial reads with Client Components for long-lived UI state and runtime interaction.

Server-driven examples:

- `app/(landing)/page.tsx` fetches GitHub star count on the server.
- `app/(dashboard)/projects/(list)/page.tsx` checks the session and reads projects on the server.
- `app/(dashboard)/projects/[id]/layout.tsx` verifies ownership on the server before rendering the workspace shell.

Client-driven examples:

- project configuration pages under `app/(dashboard)/projects/[id]/*`
- `components/layout/project-content-wrapper.tsx`
- `components/dialog/settings-dialog.tsx`
- `app/(dashboard)/skills/_components/skills-library.tsx`

## Data Fetching

### Server Reads

Server Components mainly use:

- `auth()` from `lib/auth.ts`
- cached Prisma reads from `lib/data/project.ts` and `lib/data/user-skill.ts`

These reads are request-scoped and do not try to keep live runtime state in sync after render.

### Client Reads

The client uses React Query for live state.

- `provider/providers.tsx` creates the shared `QueryClient`
- `hooks/use-project.ts` polls `/api/projects/[id]` every 3 seconds by default
- `hooks/use-environment-variables.ts` reads and mutates environment variables through internal API routes

The result is a split model:

- server render for secure entry and initial HTML
- client polling for runtime status, task progress, and mutation refresh

## Cache and Revalidation

- Landing page fetches GitHub star count with `next: { revalidate: 3600 }`.
- Query client default `staleTime` is 5 seconds.
- `useProject` uses a 2 second stale window and a 3 second refetch interval.
- `useEnvironmentVariables` uses a 5 second stale window and no focus refetch.

There is no repository-wide custom cache layer beyond React cache and React Query.

## Mutations and Server Actions

The repository uses both server actions and internal APIs.

### Server Actions

Used when the UI wants a direct write-side call:

- `createProject`
- `importProjectFromGitHub`
- `createDatabase`
- `deleteDatabase`
- `enableGlobalSkill`
- `uninstallGlobalSkill`
- GitHub installation and repository listing helpers

### Internal APIs

Used when the UI needs explicit route contracts or browser fetch:

- project polling and lifecycle control
- environment variable CRUD
- sandbox execution and status endpoints
- user configuration endpoints

## Runtime State Flow

### Project Workspace

The project layout keeps a persistent terminal shell mounted through `ProjectContentWrapper`.

- terminal state stays alive across route changes
- non-terminal pages render in a separate content panel
- route changes switch visibility instead of unmounting the terminal

This is important because sandbox terminal state depends on long-lived websocket and ttyd interaction.

### Settings and Forms

Most forms use local component state plus mutation hooks or direct fetch calls.

Common patterns:

- `useState` for form fields and dialogs
- `useTransition` for optimistic UI around server actions
- `useMutation` for environment variable writes
- `toast` notifications for success and failure

## Client State

Shared client state is limited and intentional:

- session state from NextAuth
- React Query cache
- Sealos iframe/session context
- theme selection via `next-themes`

There is no broader global store such as Redux or Zustand in the current codebase.

## Constraints

- Project status is intentionally eventual. UI polling is the primary way users observe background reconcile progress.
- Environment writes are blocked unless the project and all sandboxes are already running.
- Some sandbox operations still live under route handlers even though `lib/actions/sandbox.ts` notes a future migration toward server actions.

