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

- Node.js 22.12 or later
- pnpm 10.20.0
- PostgreSQL
- a GitHub OAuth App

Configure the GitHub OAuth callback as:

```text
${BETTER_AUTH_URL}/api/auth/callback/github
```

## Local Development

```bash
corepack pnpm install
cp .env.template .env.local
# Fill in the database, Better Auth, and GitHub values.
corepack pnpm prisma:migrate
corepack pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

This release uses a new baseline schema. Run it against a new database or an
explicitly reset database; it does not migrate v2 data.

## Commands

```bash
corepack pnpm dev              # Start the development server
corepack pnpm build            # Generate Prisma client and build
corepack pnpm lint             # Run ESLint
corepack pnpm test             # Run Vitest
corepack pnpm test:e2e         # Run Playwright
corepack pnpm prisma:format    # Format the Prisma schema
corepack pnpm prisma:validate  # Validate the Prisma schema
corepack pnpm prisma:migrate   # Deploy the baseline migration
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
