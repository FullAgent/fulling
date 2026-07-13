# Contributing to Fulling

Fulling v3 is building dedicated AI workspaces. Read
[docs/architecture.md](./docs/architecture.md) before product or architecture
work.

## Development Setup

Requirements: Node.js 22.12+, pnpm 10.20.0, PostgreSQL, and GitHub OAuth
credentials.

```bash
corepack pnpm install
cp .env.template .env.local
corepack pnpm prisma:migrate
corepack pnpm dev
```

The baseline migration targets a new or explicitly reset database. There is no
v2 data migration.

## Before Submitting

- `corepack pnpm lint`
- `corepack pnpm test`
- `corepack pnpm test:e2e`
- `corepack pnpm build`
- verify that no browser response or log includes kubeconfig content

Commits use conventional prefixes such as `feat:`, `fix:`, `docs:`, `refactor:`,
and `chore:`.
