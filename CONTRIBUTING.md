# Contributing to Fulling

Fulling v3 is building dedicated AI workspaces. Read
[docs/architecture.md](./docs/architecture.md) before product or architecture
work.

## Development Setup

Requirements: Node.js 22.12+ with its bundled npm 10+, PostgreSQL, and GitHub
OAuth credentials.

```bash
npm ci
cp .env.template .env.local
npm run prisma:migrate
npm run dev
```

The baseline migration targets a new or explicitly reset database. There is no
v2 data migration.

## Before Submitting

- `npm run lint`
- `npm test`
- `npm run test:e2e`
- `npm run build`
- verify that no browser response or log includes kubeconfig content

Commits use conventional prefixes such as `feat:`, `fix:`, `docs:`, `refactor:`,
and `chore:`.
