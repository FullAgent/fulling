# Projects and Runtime API

## Domain Summary

This domain covers live project reads, project lifecycle intent, project environment variables, and low-level sandbox helpers.

Everything here is app-internal and owner-scoped.

## Internal Endpoints

### `GET /api/projects/[id]`

Type: `internal`

Source:

- `app/api/projects/[id]/route.ts` - route entry

Auth:

- `withAuth`
- project row filtered by `userId`

Request:

- Params: `id` project ID
- Query: none
- Body: none
- Headers: session cookies

Response:

- Success: project with ordered sandboxes, databases, environments, and tasks
- Failure: `404` when the project is not owned by the user, `500` on read failure

Side effects:

- none

Main callers:

- `hooks/use-project.ts`
- `app/(dashboard)/projects/_components/import-github-dialog.tsx`

### `POST /api/projects/[id]/start`

Type: `internal`

Source:

- `app/api/projects/[id]/start/route.ts`
- `lib/repo/project.ts`
- `lib/util/action.ts`

Auth:

- `withAuth`
- project row filtered by `userId`

Request:

- Params: `id` project ID
- Query: none
- Body: none
- Headers: session cookies

Response:

- Success: message plus updated project status
- Failure: `404` when missing, `400` when current state does not allow start

Side effects:

- updates databases and sandboxes to `STARTING`
- updates project status to `STARTING`

Main callers:

- `hooks/use-project-operations.ts`

### `POST /api/projects/[id]/stop`

Type: `internal`

Source:

- `app/api/projects/[id]/stop/route.ts`
- `lib/repo/project.ts`
- `lib/util/action.ts`

Auth:

- `withAuth`
- project row filtered by `userId`

Request:

- Params: `id` project ID
- Query: none
- Body: none
- Headers: session cookies

Response:

- Success: message plus updated project status
- Failure: `404` when missing, `400` when current state does not allow stop

Side effects:

- updates databases and sandboxes to `STOPPING`
- updates project status to `STOPPING`

Main callers:

- `hooks/use-project-operations.ts`

### `POST /api/projects/[id]/delete`

Type: `internal`

Source:

- `app/api/projects/[id]/delete/route.ts`
- `lib/repo/project.ts`
- `lib/util/action.ts`

Auth:

- `withAuth`
- project row filtered by `userId`

Request:

- Params: `id` project ID
- Query: none
- Body: none
- Headers: session cookies

Response:

- Success: message plus updated project status
- Failure: `404` when missing, `400` when current state does not allow delete

Side effects:

- updates databases and sandboxes to `TERMINATING`
- eventually leads to hard deletion of runtime rows and the project row after reconcile

Main callers:

- `hooks/use-project-operations.ts`

### `GET /api/projects/[id]/environment`

Type: `internal`

Source:

- `app/api/projects/[id]/environment/route.ts`

Auth:

- `withAuth`
- `verifyProjectAccess`

Request:

- Params: `id` project ID
- Query: none
- Body: none
- Headers: session cookies

Response:

- Success: grouped environment variables by category
- Failure: `500` on lookup failure

Side effects:

- none

Main callers:

- `hooks/use-environment-variables.ts`

### `POST /api/projects/[id]/environment`

Type: `internal`

Source:

- `app/api/projects/[id]/environment/route.ts`

Auth:

- `withAuth`
- `verifyProjectAccess`

Request:

- Params: `id` project ID
- Query: none
- Body:
  - single variable `{ key, value, category?, isSecret? }`, or
  - batch `{ variables: [...] }`
- Headers: session cookies

Response:

- Success: created variable or `{ success: true, count }`
- Failure:
  - `400` for invalid body or project not fully running
  - `404` when project is missing
  - `500` on write failure

Side effects:

- creates or replaces environment rows
- marks running sandboxes as `UPDATING`

Main callers:

- `hooks/use-environment-variables.ts`

### `PUT /api/projects/[id]/environment/[envId]`

Type: `internal`

Source:

- `app/api/projects/[id]/environment/[envId]/route.ts`

Auth:

- `withAuth`
- `verifyProjectAccess`

Request:

- Params:
  - `id` project ID
  - `envId` environment row ID
- Query: none
- Body: `{ value }`
- Headers: session cookies

Response:

- Success: updated environment row
- Failure:
  - `400` for missing value or non-running project
  - `404` when the env row is not in that project
  - `500` on write failure

Side effects:

- updates one env row
- marks running sandboxes as `UPDATING`

Main callers:

- `hooks/use-environment-variables.ts`

### `DELETE /api/projects/[id]/environment/[envId]`

Type: `internal`

Source:

- `app/api/projects/[id]/environment/[envId]/route.ts`

Auth:

- `withAuth`
- `verifyProjectAccess`

Request:

- Params:
  - `id` project ID
  - `envId` environment row ID
- Query: none
- Body: none
- Headers: session cookies

Response:

- Success: `{ success: true }`
- Failure:
  - `400` when the project is not fully running
  - `404` when the env row is not in that project
  - `500` on delete failure

Side effects:

- deletes one env row
- marks running sandboxes as `UPDATING`

Main callers:

- `hooks/use-environment-variables.ts`

### `GET /api/sandbox/[id]/cwd`

Type: `internal`

Source:

- `app/api/sandbox/[id]/cwd/route.ts`
- `lib/k8s/k8s-service-helper.ts`

Auth:

- `withAuth`
- sandbox ownership resolved from the parent project

Request:

- Params: `id` sandbox ID
- Query: `sessionId` required
- Body: none
- Headers: session cookies

Response:

- Success: `{ cwd, homeDir, isInHome }`
- Failure: `400` for missing query param, `500` for runtime errors

Side effects:

- none

Main callers:

- `components/terminal/xterm-terminal.tsx`

### `POST /api/sandbox/[id]/exec`

Type: `internal`

Source:

- `app/api/sandbox/[id]/exec/route.ts`
- `lib/k8s/k8s-service-helper.ts`

Auth:

- `withAuth`
- sandbox ownership resolved from the parent project

Request:

- Params: `id` sandbox ID
- Query: none
- Body: `{ command, workdir? }`
- Headers: session cookies

Response:

- Success: `{ success: true, pid }`
- Failure: `400` for missing command, `500` for execution failure

Side effects:

- starts a background process in the sandbox

Main callers:

- `hooks/use-app-runner.ts`

### `GET /api/sandbox/[id]/app-status`

Type: `internal`

Source:

- `app/api/sandbox/[id]/app-status/route.ts`

Auth:

- `withAuth`
- sandbox ownership resolved from the parent project

Request:

- Params: `id` sandbox ID
- Query: none
- Body: none
- Headers: session cookies

Response:

- Success: `{ running: boolean }`
- Failure: returns `{ running: false }` on handler error

Side effects:

- none

Main callers:

- no direct in-repo caller was found

### `DELETE /api/sandbox/[id]/app-status`

Type: `internal`

Source:

- `app/api/sandbox/[id]/app-status/route.ts`

Auth:

- `withAuth`
- sandbox ownership resolved from the parent project

Request:

- Params: `id` sandbox ID
- Query: none
- Body: none
- Headers: session cookies

Response:

- Success: `{ success: true }` or `{ success: false, error }`
- Failure: `500` when the stop operation itself throws

Side effects:

- kills the process listening on sandbox port `3000`

Main callers:

- no direct in-repo caller was found

## Shared Dependencies

- `lib/api-auth.ts`
- `lib/repo/project.ts`
- `lib/k8s/k8s-service-helper.ts`
- `lib/util/action.ts`

## Main Callers

- `hooks/use-project.ts`
- `hooks/use-project-operations.ts`
- `hooks/use-environment-variables.ts`
- terminal components and sandbox execution hooks

