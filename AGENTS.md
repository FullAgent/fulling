# AGENTS.md

This file provides guidance to AI agents when working with code in this repository.

## Project Overview

**Fulling v3.0** is building **dedicated AI workspaces** — persistent, personalizable environments with skills, files, memory, scripts, and runtime. Think of it as an **out-of-the-box AI toolkit** that users can customize and share.

Read [docs/architecture.md](./docs/architecture.md) before product or architecture work. It is the source of truth for the v3 workspace model.

## Tech Stack

- Next.js 16 (App Router) + React 19 + TypeScript
- Tailwind CSS v4 + Shadcn/UI
- Node.js 22 + Prisma + Better Auth
- Kubernetes + PostgreSQL

## Code Conventions

- TypeScript strict mode
- Functional components with hooks
- In `lib/platform/`: one primary action per file, noun directories + verb file names, boundary comment above main exported function
- Route-specific components in `_components/` directory
- Shared components in top-level `components/`

## Current Implementation Context

- GitHub is the only authentication provider.
- Better Auth stores users, provider accounts, and sessions in PostgreSQL.
- Each user may store one plaintext kubeconfig; browser APIs never return it.
- **Always use the user-specific K8s service**:
  `const k8sService = await getK8sServiceForUser(userId)`.
- The current user-level kubeconfig is a foundation boundary, not the final v3
  Workspace Runtime ownership model.

## UI Direction

The active v3 design system is defined in [docs/design.md](./docs/design.md).
It derives from SST and is the source of truth for Fulling's visual language,
tokens, typography, spacing, components, states, and responsive behavior. Read
it before substantial UI work. Existing UI that conflicts with it is migration
work, not design precedent.

Avoid generic AI copywriting cliches such as "Elevate", "Seamless", and
"Unleash".

## Key Files

- [docs/architecture.md](./docs/architecture.md) — v3 system architecture and product model
- [docs/design.md](./docs/design.md) — active v3 design system and SST-derived style reference
- `lib/auth/` — Better Auth and application session boundary
- `lib/kubeconfig/` — User credential persistence
- `lib/k8s/` — Validation and user-specific Kubernetes service

## Image Tagging Policy

Manual image publishing uses a single GHCR repository:

```text
ghcr.io/fullagent/fulling
```

For formal releases tagged `vX.Y.Z`, publish:

```text
ghcr.io/fullagent/fulling:vX.Y.Z
ghcr.io/fullagent/fulling:sha-<short-sha>
ghcr.io/fullagent/fulling:latest
```

For prereleases tagged `vX.Y.Z-alpha.N`, `vX.Y.Z-beta.N`, or `vX.Y.Z-rc.N`,
publish:

```text
ghcr.io/fullagent/fulling:vX.Y.Z-alpha.N
ghcr.io/fullagent/fulling:vX.Y.Z-beta.N
ghcr.io/fullagent/fulling:vX.Y.Z-rc.N
ghcr.io/fullagent/fulling:sha-<short-sha>
```

Prereleases must not update `latest`.

For temporary validation images that are not releases, use purpose-prefixed SHA
tags only:

```text
ghcr.io/fullagent/fulling:dev-<short-sha>
ghcr.io/fullagent/fulling:test-<short-sha>
ghcr.io/fullagent/fulling:debug-<short-sha>
```

Do not use ambiguous moving tags such as `main`, `stable`, `prod`, `release`,
`v3`, or `v3.0`.

## Development Commands

```bash
corepack pnpm dev              # Start dev server
corepack pnpm build            # Build for production
corepack pnpm lint             # Run ESLint
corepack pnpm test             # Run Vitest
corepack pnpm test:e2e         # Run Playwright
corepack pnpm prisma:migrate   # Deploy the baseline migration
```
