# Auth and Identity

## Purpose

This domain gets a user into the product and binds external identities to a stable Fulling user record.

## User-Facing Surfaces

- `/login` - credentials sign-in plus GitHub sign-in
- `/auth-error` - auth failure surface
- `/github/app/callback` - popup completion view for GitHub App installation

## Main Flows

- Credentials sign-in doubles as auto-registration when the username does not exist yet.
- GitHub sign-in creates or refreshes a `GITHUB` identity and maps it onto a Fulling user.
- Sealos auth can bootstrap kubeconfig and AI proxy settings for users coming from a Sealos environment.

## Supporting APIs

- `GET | POST /api/auth/[...nextauth]` - NextAuth handler
- `GET /api/github/app/callback` - bind GitHub App installation to the current user

## Key Modules

- `app/(auth)/login/page.tsx` - login UI
- `lib/auth.ts` - auth providers, callbacks, and cookie/session policy
- `provider/sealos.tsx` - Sealos environment detection
- `lib/actions/sealos-auth.ts` - server-side Sealos sign-in helper
- `app/github/app/callback/page.tsx` - popup completion flow

## Constraints

- Available auth providers depend on environment flags.
- There is no role or team permission model yet; access is owner-scoped.
- GitHub App install completion is not enough by itself; the installation must still be bound to the authenticated Fulling user.

