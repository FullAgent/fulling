# Contributing to Fulling

Thank you for your interest in Fulling. This document covers the essentials for contributing effectively.

## Project Direction

Fulling v3.0 is building **dedicated AI workspaces** — persistent, personalizable environments with skills, files, memory, scripts, and runtime. Before contributing, read [README.md](./README.md) for the product vision and [design/DESIGN.md](./design/DESIGN.md) for the UI design system.

## Development Setup

Prerequisites: Node.js 22.12.0+, pnpm 10.20.0+, PostgreSQL, Kubernetes with KubeBlocks.

```bash
git clone https://github.com/FullAgent/fulling.git
cd fulling
pnpm install
cp .env.template .env.local
# Edit .env.local with your settings
npx prisma generate
npx prisma db push
pnpm dev
```

Generated repository documentation lives in [.qoder/repowiki](./.qoder/repowiki).
Regenerate it when code structure changes materially.

## Before Submitting

- [ ] `pnpm lint` passes
- [ ] `pnpm build` succeeds
- [ ] UI changes follow [design/DESIGN.md](./design/DESIGN.md)
- [ ] Commits use conventional format: `feat:`, `fix:`, `docs:`, `refactor:`, `chore:`

## Reporting Issues

- Search existing issues first
- One issue per bug or feature request
- Include: reproduction steps, expected vs actual behavior, environment info

## Questions?

Open a [GitHub Discussion](https://github.com/FullAgent/fulling/discussions) or ask in an existing issue.
