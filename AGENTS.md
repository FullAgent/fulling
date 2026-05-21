# AGENTS.md

This file provides guidance to AI agents when working with code in this repository.

## Project Overview

**Fulling v3.0** is building **dedicated AI workspaces** — persistent, personalizable environments with skills, files, memory, scripts, and runtime. Think of it as an **out-of-the-box AI toolkit** that users can customize and share.

Before making any UI changes, read [design/DESIGN.md](./design/DESIGN.md) for the complete design system specification.

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

## Architecture Patterns

- **Asynchronous reconciliation**: API → Database → Reconciliation Job → Event → K8s Operation
- **Always use user-specific K8s service**: `const k8sService = await getK8sServiceForUser(userId)`
- **Optimistic locking** in Repository layer
- **Non-blocking APIs**: endpoints only update DB, return immediately

## Anti-Patterns (Never Do)

- No emojis anywhere in the UI
- No Inter font
- No generic serif fonts
- No pure black (`#000000`)
- No purple/neon glows
- No oversaturated accents
- No 3-column equal card layouts
- No centered Hero sections (use asymmetric splits)
- No AI copywriting cliches ("Elevate", "Seamless", "Unleash")

## Key Files

- [design/DESIGN.md](./design/DESIGN.md) — Design system (read before any UI work)
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
