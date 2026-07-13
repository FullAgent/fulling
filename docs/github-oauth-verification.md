# GitHub OAuth Verification

Automated tests do not contact GitHub. Complete this checklist with an authorized
GitHub OAuth App before release.

## Configuration

- Set `BETTER_AUTH_URL` to the exact application origin.
- Configure `${BETTER_AUTH_URL}/api/auth/callback/github` as the OAuth callback.
- Set a unique `BETTER_AUTH_SECRET` with at least 32 characters.
- Configure `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET`.
- Start with a new database containing the v3 baseline migration.

## Checklist

1. Open `/login` while signed out and verify GitHub is the only sign-in method.
2. Complete GitHub authorization and verify the browser returns to `/workspace`.
3. Verify one `User`, one GitHub `Account`, and one active `Session` were created.
4. Sign out and verify `/workspace` redirects to `/login`.
5. Sign in with the same GitHub account and verify the existing User and Account
   are reused while a new Session is created.
6. Open `/workspace` in a new request and verify the database session persists.
7. Revoke the session in the database and verify the next protected request is
   rejected.
8. Trigger an OAuth denial or invalid callback and verify the browser returns to
   `/login?error=oauth` without exposing provider details.

Never include OAuth tokens, session tokens, or kubeconfig content in verification
notes.
