# Auth and GitHub API

## Domain Summary

This domain covers identity exchange, GitHub App installation binding, and GitHub webhook lifecycle updates.

## Public Endpoints

### `GET | POST /api/auth/[...nextauth]`

Type: `public`

Source:

- `app/api/auth/[...nextauth]/route.ts` - route entry
- `lib/auth.ts` - provider and callback configuration

Auth:

- Owned by NextAuth
- Provider-specific auth happens inside the NextAuth handler

Request:

- Params: dynamic catch-all segment used by NextAuth
- Query: NextAuth-managed
- Body: provider-specific, including credentials or OAuth callback payloads
- Headers: browser session and CSRF cookies as required by NextAuth

Response:

- Success: NextAuth-managed redirects, session cookies, or JSON depending on the auth sub-route
- Failure: NextAuth error responses or redirect to `/auth-error`

Side effects:

- creates or updates `User`
- creates or updates `UserIdentity`
- stores JWT-backed session state
- sets cross-site-friendly auth cookies

Main callers:

- `app/(auth)/login/page.tsx` - credentials and GitHub sign-in UI
- `lib/actions/sealos-auth.ts` - Sealos server-side sign-in helper

### `GET /api/github/app/callback`

Type: `public`

Source:

- `app/api/github/app/callback/route.ts` - route entry
- `lib/services/github-app.ts` - OAuth exchange and installation lookup
- `lib/repo/github.ts` - installation persistence

Auth:

- Requires an authenticated Fulling session
- Verifies installation ownership unless OAuth exchange already established that link

Request:

- Params: none
- Query:
  - `installation_id` required
  - `setup_action` optional
  - `code` optional
- Body: none
- Headers: session cookies

Response:

- Success: small HTML page that posts a success message to the opener and closes itself
- Failure: JSON error for missing auth or invalid install context, or failure HTML page

Side effects:

- may exchange GitHub OAuth code for user tokens
- upserts `GITHUB` `UserIdentity`
- creates or updates `GitHubAppInstallation`

Main callers:

- `app/github/app/callback/page.tsx` - popup completion page that forwards query params here
- GitHub App installation redirect flow

### `POST /api/github/app/webhook`

Type: `public`

Source:

- `app/api/github/app/webhook/route.ts` - route entry
- `lib/services/github-app.ts` - webhook signature verification
- `lib/repo/github.ts` - installation status updates

Auth:

- No session auth
- Requires valid `x-hub-signature-256` verification

Request:

- Params: none
- Query: none
- Body: GitHub webhook JSON payload
- Headers:
  - `x-hub-signature-256`
  - `x-github-event`

Response:

- Success: `{ "ok": true }`
- Failure: `401` for invalid signature, `500` for processing failures

Side effects:

- updates GitHub installation status for `deleted`, `suspend`, and `unsuspend`

Main callers:

- GitHub webhook delivery

## Shared Dependencies

- `lib/auth.ts`
- `lib/services/github-app.ts`
- `lib/repo/github.ts`
- Prisma models `UserIdentity` and `GitHubAppInstallation`

## Main Callers

- login page
- Sealos auth server action
- popup callback page
- GitHub App install popup flows from settings and import dialogs

