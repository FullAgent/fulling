# Auth and State

## Auth Providers

Authentication is configured centrally in `lib/auth.ts` through NextAuth v5.

Provider availability is environment-driven:

- password credentials
- Sealos credentials
- GitHub App OAuth

### Password Flow

The credentials provider doubles as sign-in and registration.

- if the password identity exists, the password hash is verified
- if it does not exist, the user is created automatically with a new password hash

### Sealos Flow

Sealos auth is exposed through the `sealos` credentials provider.

It:

- validates the JWT
- extracts the Sealos user ID
- stores kubeconfig on the matching `UserIdentity`
- updates `UserConfig.KUBECONFIG`
- can bootstrap Anthropic proxy credentials for the user

### GitHub Flow

GitHub App OAuth uses a custom provider wrapper and a `signIn` callback that:

- creates or updates a `GITHUB` `UserIdentity`
- persists access and refresh tokens
- maps the GitHub identity to a Fulling user

## Session and Cookies

- session strategy: `jwt`
- session payload is minimal and stores `user.id` and `user.name`
- cookies are configured with `sameSite: 'none'` and `secure: true`

The cookie configuration is intentionally cross-site friendly for Sealos iframe embedding.

## Authorization Checks

The repository does not rely on middleware for authorization.

Instead, checks happen close to the resource:

- Server Components call `auth()` and redirect unauthenticated users
- API routes wrap handlers with `withAuth`
- project ownership checks use helpers such as `verifyProjectAccess`
- sandbox ownership checks resolve through the parent project relationship

This produces an owner-scoped model rather than a role-based permission model.

## Shared Client State

The main shared state containers are:

- `SessionProvider`
- `QueryClientProvider`
- `SealosProvider`
- `ThemeProvider`

`SealosProvider` detects whether the app is running inside a Sealos iframe and, when applicable, loads the Sealos session and kubeconfig.

## Form and Mutation State

The UI mostly uses local React state for forms and tabs. Network state is layered on top through:

- `useTransition`
- React Query mutations
- `toast` notifications

This keeps state localized instead of centralizing all writes in a global store.

## Constraints

- Provider availability depends on environment flags, so deployment configuration can materially change the visible auth surface.
- GitHub App callback handling is partly public-facing but still expects an authenticated Fulling session to bind the installation to the correct user.
- The repository currently models ownership and identity, not granular roles or team permissions.

