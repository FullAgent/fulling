# Fulling

<div align="center">
  <img src="./public/icon-transparent.svg" alt="Fulling" width="72" height="72" />

  <p><strong>Package AI workspaces once. Share them with people who just need the AI to work.</strong></p>

  <p>
    <img src="https://img.shields.io/badge/v3.0-workspace_delivery-7cc4a4?style=for-the-badge" alt="Fulling v3.0 workspace delivery" />
    <img src="https://img.shields.io/badge/v2.0.0-released-blue?style=for-the-badge" alt="Fulling v2.0.0 released" />
    <img src="https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js" alt="Next.js 16" />
    <img src="https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript" alt="TypeScript 5" />
  </p>

  <p>
    <a href="#overview">Overview</a> •
    <a href="#workspace-model">Workspace model</a> •
    <a href="#how-it-works">How it works</a> •
    <a href="#project-status">Project status</a> •
    <a href="#local-development">Local development</a>
  </p>
</div>

## Overview

Fulling is a product for creating ready-to-use AI workspaces.

It is built around a practical problem: many professionals can benefit from AI,
but they do not want to configure skills, prompts, memory, scripts, integrations,
or runtime settings. Fulling gives creators a place to assemble those pieces,
then share the finished workspace with the person who needs it.

> [!NOTE]
> Fulling v3.0 centers on workspace delivery: the setup work happens once, and
> the recipient opens a prepared AI workspace instead of learning the AI stack.

## Why Fulling?

Most AI tools start with an empty chat box. That works for people who already
know how to prompt, configure tools, and judge the outputs. It breaks down when
the user is a domain expert who simply needs help with real work.

Fulling turns that setup into a deliverable:

- a building designer receives a workspace with drawing review workflows,
  project references, and report templates
- a consultant receives a workspace with client materials, analysis scripts,
  and reusable delivery formats
- a team receives a workspace with shared context, approved tools, and repeatable
  operating routines

The recipient uses the workspace. The creator owns the configuration.

## Workspace Model

An AI workspace combines the context, capabilities, and runtime needed for a
specific person or job.

| Part | Purpose |
| --- | --- |
| Mission | The job this AI workspace exists to help with |
| Knowledge | Files, notes, examples, references, and domain material |
| Memory | Durable context that can evolve over time |
| Skills | Named capabilities the AI can use |
| Scripts | Repeatable actions for work that needs reliability |
| Runtime | A place where tools, code, and automation can run |
| Sharing | A way to hand the configured workspace to another user |

## How It Works

```text
Create
  -> choose who the workspace is for
  -> describe the work it supports
  -> add knowledge and files
  -> configure skills, scripts, memory, and runtime
  -> test the workspace
  -> share it with the recipient

Use
  -> open the prepared workspace
  -> ask for work through task-focused entry points
  -> review outputs, files, and approvals
  -> keep using the same workspace as context grows
```

## What Fulling Is Not

Fulling is not a prompt marketplace, generic chatbot builder, Kubernetes UI, or
DevOps control panel. Those pieces can exist behind the scenes, but the product
is organized around prepared AI workspaces.

## Project Status

Fulling v3.0 is the active product direction. The current repository is being
realigned around the workspace delivery model described above.

The previous v2.0.0 release is available at
[Fulling v2.0.0](https://github.com/FullAgent/fulling/releases/tag/v2.0.0).

Active branches:

- `v3.0` for the current product direction
- `release/2.0` for v2 maintenance
- `main` is not the target branch for v3 work

## Tech Stack

| Area | Stack |
| --- | --- |
| App | Next.js 16 App Router, React 19, TypeScript |
| UI | Tailwind CSS v4, Shadcn/UI, Radix UI |
| Data | Prisma, PostgreSQL |
| Auth | NextAuth v5 |
| Runtime | Kubernetes, KubeBlocks PostgreSQL, ttyd, FileBrowser |
| Integrations | GitHub App, sandbox-side commands, AI proxy |
| Testing | Vitest, ESLint |

## Repository Map

```text
app/                     Next.js routes, dashboard, auth, API endpoints
components/              Shared UI and layout components
lib/                     Application libraries and service code
prisma/                  Database schema and migrations
runtime/                 Runtime image and sandbox support files
public/                  Static icons and assets
```

## Local Development

### Prerequisites

- Node.js 22.12.0 or later
- pnpm 10.20.0
- PostgreSQL database
- Kubernetes cluster with KubeBlocks installed
- GitHub App and OAuth credentials for GitHub integration work

### Setup

```bash
git clone https://github.com/FullAgent/fulling.git
cd fulling
pnpm install
cp .env.template .env.local
npx prisma generate
npx prisma db push
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Useful Commands

```bash
pnpm dev              # Start the development server
pnpm build            # Generate Prisma client and build for production
pnpm lint             # Run ESLint
pnpm test             # Run Vitest
pnpm test:watch       # Run Vitest in watch mode
npx prisma generate   # Generate Prisma client
npx prisma db push    # Push schema changes to the database
```

## Documentation

- [AGENTS.md](./AGENTS.md) - agent guidance for this repository
- [docs/architecture.md](./docs/architecture.md) - v3 system architecture
