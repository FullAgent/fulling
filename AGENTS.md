# AGENTS.md

This file provides guidance to AI agents when working with code in this repository.

## Project Overview

**Fulling v3.0** is building **dedicated AI workspaces** — persistent, personalizable environments with skills, files, memory, scripts, and runtime. Think of it as an **out-of-the-box AI toolkit** that users can customize and share.

Read [docs/architecture.md](./docs/architecture.md) before product or architecture work. It is the source of truth for the v3 workspace model.

## Tech Stack

- Next.js 16 (App Router) + React 19 + TypeScript
- Tailwind CSS v4 + Shadcn/UI
- Node.js 22 + Prisma + NextAuth v5
- Kubernetes + PostgreSQL (KubeBlocks)

## Code Conventions

- TypeScript strict mode
- Functional components with hooks
- In `lib/platform/`: one primary action per file, noun directories + verb file names, boundary comment above main exported function
- Route-specific components in `_components/` directory
- Shared components in top-level `components/`

## Current Implementation Context

- Existing code still contains v2 project/resource abstractions. Do not treat them as v3 product architecture.
- **Asynchronous reconciliation** exists in current code: API → Database → Reconciliation Job → Event → K8s Operation
- **Always use user-specific K8s service**: `const k8sService = await getK8sServiceForUser(userId)`
- **Optimistic locking** in Repository layer
- **Non-blocking APIs**: endpoints only update DB, return immediately

## UI Direction

There is no active v3 design system in the repository. The previous design draft
has been removed. Before substantial UI work, define or confirm the current
visual direction instead of inheriting old visual rules.

Avoid generic AI copywriting cliches such as "Elevate", "Seamless", and
"Unleash".

## Key Files

- [docs/architecture.md](./docs/architecture.md) — v3 system architecture and product model
- `lib/k8s/k8s-service-helper.ts` — User-specific K8s service
- `lib/events/` + `lib/jobs/` — Reconciliation core
- `instrumentation.ts` — Application startup

## Development Commands

```bash
pnpm dev              # Start dev server
pnpm build            # Build for production
pnpm lint             # Run ESLint
npx prisma generate   # Generate Prisma client
npx prisma db push    # Push schema to database
```
