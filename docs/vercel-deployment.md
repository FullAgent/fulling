# Vercel Deployment

Fulling's public application can be deployed to Vercel without configuring
GitHub OAuth, Better Auth, or PostgreSQL. Those integrations are currently
optional so they do not block preview and production builds while workspace
access is being rebuilt.

## Project settings

Connect `FullAgent/fulling` to a Vercel project and keep these settings:

- Framework preset: Next.js
- Root directory: repository root
- Install command: Vercel default (`npm install` from `package-lock.json`)
- Build command: `npm run build`
- Output directory: Vercel default
- Node.js: 22.x, enforced by `package.json`
- Production branch: `main`

No `vercel.json` file or application environment variables are required for this
deployment mode. Do not set `SKIP_ENV_VALIDATION`; absent optional integrations
are handled by the application itself.

`output: 'standalone'` remains enabled because the Docker image consumes it.
Vercel uses its native Next.js output.

## Zero-configuration behavior

Without the legacy Auth and database variables:

- `/` renders the public landing page.
- `/login` renders an explicit sign-in unavailable state.
- `/api/auth/*` returns `503 AUTH_UNAVAILABLE` instead of initializing Better
  Auth with an unsafe default secret.
- Protected workspace routes redirect to `/login`.
- No Prisma query or Kubernetes credential operation is attempted for anonymous
  requests.

The legacy Auth path is enabled only when all five variables are present:

- `DATABASE_URL`
- `BETTER_AUTH_URL`
- `BETTER_AUTH_SECRET`
- `GITHUB_CLIENT_ID`
- `GITHUB_CLIENT_SECRET`

This compatibility path is not required for the current Vercel deployment and
will be replaced with the next authentication design.

## Deploy and verify

With Git integration, push a feature branch to create a Preview deployment and
merge the verified commit to `main` for Production.

Verify the zero-configuration deployment:

1. Confirm `/` returns a successful response and renders the landing page.
2. Confirm `/login` returns a successful response and shows the unavailable
   state without a Better Auth error.
3. Confirm a request to `/api/auth/session` returns a structured 503 response.
4. Inspect the build and Function logs and confirm there are no missing-secret,
   Prisma connection, or Kubernetes connection errors.

Inspect a deployment in the Vercel dashboard or with the CLI:

```bash
vercel inspect <deployment-url>
vercel logs <deployment-url>
```

Roll back a bad production deployment with:

```bash
vercel rollback
```
