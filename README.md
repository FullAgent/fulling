# Fulling

Fulling is building dedicated AI workspaces: persistent environments that combine
skills, files, memory, scripts, and runtime. The current v3 foundation provides
the identity and Kubernetes credential boundary required for that product model.

## Current Foundation

- GitHub-only sign-in through Better Auth
- PostgreSQL-backed users, provider accounts, and sessions
- a protected application workspace entry
- one plaintext kubeconfig per user
- authenticated kubeconfig validation through Kubernetes `SelfSubjectReview`
- a user-scoped Kubernetes client boundary

The repository intentionally contains no compatibility layer for the previous
product model or authentication system.

Read [docs/architecture.md](./docs/architecture.md) for the target Workspace model.
The user-level kubeconfig in this foundation is not the final Workspace Runtime
ownership model.

## Requirements

- Node.js 22.12 or later, including its bundled npm 10 or later
- PostgreSQL
- a GitHub OAuth App

Configure the GitHub OAuth callback as:

```text
${BETTER_AUTH_URL}/api/auth/callback/github
```

## Local Development

```bash
npm ci
cp .env.template .env.local
# Fill in the database, Better Auth, and GitHub values.
npm run prisma:migrate
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

This release uses a new baseline schema. Run it against a new database or an
explicitly reset database; it does not migrate v2 data.

## Commands

```bash
npm run dev              # Start the development server
npm run build            # Generate Prisma client and build
npm run lint             # Run ESLint
npm test                 # Run Vitest
npm run test:e2e         # Run Playwright
npm run prisma:format    # Format the Prisma schema
npm run prisma:validate  # Validate the Prisma schema
npm run prisma:migrate   # Deploy the baseline migration
```

## Credential Boundary

Kubeconfigs are stored as plaintext in PostgreSQL. Database read access grants
access to users' Kubernetes credentials. Browser-facing APIs never return saved
content, and logs must not contain tokens, keys, certificates, or kubeconfig
content.

Validation rejects executable credential plugins, auth-provider plugins, local
file credential fields, proxy configuration, non-HTTPS API servers, redirects,
and anonymous identities. Authenticated users may still configure an HTTPS API
server on any network address. This authenticated outbound-request/SSRF boundary
is an explicit deployment decision.

## Deployment Reset

Before replacing a v2 deployment, follow
[docs/v2-resource-inventory.md](./docs/v2-resource-inventory.md). Resetting the
Fulling database does not delete Kubernetes resources created by v2.

Use [docs/github-oauth-verification.md](./docs/github-oauth-verification.md) to
verify a real OAuth application before release.
