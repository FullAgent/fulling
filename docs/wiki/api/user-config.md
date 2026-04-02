# User Config API

## Domain Summary

This domain stores user-scoped configuration rather than project-scoped runtime state. It backs the settings dialog and parts of the integrations page.

## Internal Endpoints

### `GET /api/user/config`

Type: `internal`

Source:

- `app/api/user/config/route.ts`

Auth:

- `withAuth`

Request:

- Params: none
- Query: `keys=KEY1,KEY2` required
- Body: none
- Headers: session cookies

Response:

- Success: `{ configs: { KEY: value } }`
- Failure: `400` when keys are missing, `500` on lookup failure

Side effects:

- none

Main callers:

- generic settings fetch usage

### `POST /api/user/config`

Type: `internal`

Source:

- `app/api/user/config/route.ts`

Auth:

- `withAuth`

Request:

- Params: none
- Query: none
- Body: `{ configs: [{ key, value, category?, isSecret? }] }`
- Headers: session cookies

Response:

- Success: `{ success: true, configs: [...] }`
- Failure: `400` for invalid bodies, `500` on write failure

Side effects:

- upserts one or more `UserConfig` rows

Main callers:

- generic settings save usage

### `GET /api/user/config/anthropic`

Type: `internal`

Source:

- `app/api/user/config/anthropic/route.ts`

Auth:

- `withAuth`

Request:

- Params: none
- Query: none
- Body: none
- Headers: session cookies

Response:

- Success: `{ apiKey, apiBaseUrl, model, smallFastModel }`
- Failure: `500` on lookup failure

Side effects:

- none

Main callers:

- `components/dialog/settings-dialog.tsx`

### `POST /api/user/config/anthropic`

Type: `internal`

Source:

- `app/api/user/config/anthropic/route.ts`

Auth:

- `withAuth`

Request:

- Params: none
- Query: none
- Body:
  - `apiBaseUrl` required
  - `apiKey` required
  - `model` optional
  - `smallFastModel` optional
- Headers: session cookies

Response:

- Success: `{ success: true, message }`
- Failure: `400` for missing or invalid values, `500` on write failure

Side effects:

- upserts or deletes Anthropic-related `UserConfig` rows in a transaction

Main callers:

- `components/dialog/settings-dialog.tsx`

### `GET /api/user/config/kc`

Type: `internal`

Source:

- `app/api/user/config/kc/route.ts`

Auth:

- `withAuth`

Request:

- Params: none
- Query: none
- Body: none
- Headers: session cookies

Response:

- Success: `{ kubeconfig, namespace }`
- Failure: `404` when kubeconfig is absent, `500` on lookup failure

Side effects:

- none

Main callers:

- `components/dialog/settings-dialog.tsx`

### `POST /api/user/config/kc`

Type: `internal`

Source:

- `app/api/user/config/kc/route.ts`
- `lib/k8s/k8s-service-helper.ts`
- `lib/k8s/kubernetes-utils.ts`

Auth:

- `withAuth`

Request:

- Params: none
- Query: none
- Body: `{ kubeconfig }`
- Headers: session cookies

Response:

- Success: `{ success: true, namespace, message }`
- Failure: `400` for missing or invalid kubeconfig, `500` on write failure

Side effects:

- validates kubeconfig
- upserts `KUBECONFIG`
- clears the cached per-user Kubernetes service instance

Main callers:

- `components/dialog/settings-dialog.tsx`

### `GET /api/user/config/system-prompt`

Type: `internal`

Source:

- `app/api/user/config/system-prompt/route.ts`

Auth:

- `withAuth`

Request:

- Params: none
- Query: none
- Body: none
- Headers: session cookies

Response:

- Success: `{ systemPrompt }`
- Failure: `500` on lookup failure

Side effects:

- none

Main callers:

- `components/dialog/settings-dialog.tsx`

### `POST /api/user/config/system-prompt`

Type: `internal`

Source:

- `app/api/user/config/system-prompt/route.ts`

Auth:

- `withAuth`

Request:

- Params: none
- Query: none
- Body: `{ systemPrompt }`
- Headers: session cookies

Response:

- Success: `{ success: true, message }`
- Failure: `400` for missing prompt, `500` on write failure

Side effects:

- upserts `SYSTEM_PROMPT` in `UserConfig`

Main callers:

- `components/dialog/settings-dialog.tsx`

## Shared Dependencies

- `lib/api-auth.ts`
- Prisma `UserConfig`
- `components/dialog/settings-dialog.tsx`

## Main Callers

- settings dialog
- user settings flows

