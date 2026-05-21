# Fulling

<div align="center">
  <img src="https://img.shields.io/badge/v3.0-vision-7cc4a4?style=for-the-badge" alt="Version 3.0 vision"/>
  <img src="https://img.shields.io/badge/v2.0.0-released-blue?style=for-the-badge" alt="Version 2.0.0 released"/>
  <img src="https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js" alt="Next.js"/>
  <img src="https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript" alt="TypeScript"/>
  <img src="https://img.shields.io/badge/Kubernetes-1.28-326ce5?style=for-the-badge&logo=kubernetes" alt="Kubernetes"/>
  <img src="https://img.shields.io/badge/Claude_Code-AI-purple?style=for-the-badge" alt="Claude Code"/>
</div>

## What Is Fulling?

**Fulling turns AI from a conversation into a working environment.**

Most AI products start and end with a prompt. Fulling is built around a more
durable idea: an AI that has its own skills, files, memory, scripts, and
runtime.

The v3.0 direction is to make these environments personal, persistent, and easy
to give to someone else:

> Give an AI a mission, the materials it needs, the tools it can use, and a
> runtime where it can work. Then hand it to the person or project it was made
> for.

## Why This Matters

Most AI products package behavior as prompts. Prompts are easy to copy, but they
are weak as durable work environments:

- They do not own files.
- They do not naturally keep inspectable memory.
- They do not have scripts for repeatable work.
- They do not have a runtime where real tools can execute.
- They are hard to hand to another person as a long-term assistant.

Fulling is built around a different object: **a dedicated AI workspace**.

That workspace should feel like giving someone a small, persistent AI operator
that already understands its job, owns its materials, and can keep working after
the initial setup session ends.

## The 3.0 Direction

The internal bar for 3.0 is speed and clarity: creating one of these AI
environments should feel casual enough to do for a friend, teammate, customer,
or project.

The intended shape:

1. Choose who this AI is for.
2. Describe what this AI should help with.
3. Add files, notes, examples, and domain knowledge.
4. Select or generate skills and scripts.
5. Start the runtime.
6. Test the AI in its own workspace.
7. Share it with the person it was made for.

The output is not just a chat configuration. The output is a living workspace
with:

- **Skills** - explicit capabilities the AI can use.
- **Files** - documents, project assets, examples, and working material.
- **Memory** - durable, inspectable context that can evolve over time.
- **Scripts** - reliable repeatable actions, not just natural language intent.
- **Runtime** - an isolated environment where code, tools, and automation can run.

## What This Is Not

Fulling 3.0 should not become a generic platform dashboard.

It is not primarily:

- a prompt marketplace
- a DevOps control panel
- a generic chatbot builder
- a Kubernetes UI
- a menu of disconnected AI features

Those capabilities may exist underneath, but the product experience should stay
focused on one job: **create and deliver a long-lived dedicated AI workspace**.

## Current Foundation

The current codebase is the v2.0 foundation for this direction.

Fulling v2.0.0 is already released and provides:

- project creation from scratch
- GitHub App based repository import
- isolated Kubernetes sandboxes
- browser terminal and file manager access
- live HTTPS runtime URLs
- optional PostgreSQL databases
- persisted background reconciliation for resources and project tasks
- global skill enablement and uninstall fan-out through `ProjectTask`

These are the building blocks for 3.0. The next step is to reorganize the
product around dedicated AI workspaces rather than exposing the underlying
resource plane as the primary user experience.

## Branch Strategy

The repository now has clear long-lived lines:

- `release/2.0` - v2 stabilization and patch work only
- `v3.0` - the active 3.0 product and architecture branch
- `main` - not the target branch for 3.0 work

The v2 release is available at:

- [Fulling v2.0.0 Release](https://github.com/FullAgent/fulling/releases/tag/v2.0.0)

Generated repository documentation lives under:

- [.qoder/repowiki](./.qoder/repowiki)

## Architecture Direction

The underlying system is a database-driven asynchronous control plane:

```text
User intent
-> persisted desired state
-> reconciliation jobs
-> external execution
-> durable workspace state
-> user-visible progress
```

The v2 implementation already separates several important concerns:

- **Control plane** - user actions, authentication, database state
- **Resource plane** - sandbox and database lifecycle
- **Task plane** - async project-level work through `ProjectTask`
- **Execution layer** - Kubernetes, ttyd, GitHub App, and sandbox-side commands

For 3.0, these layers should move behind a simpler product model:

```text
Dedicated AI
  -> profile
  -> mission
  -> knowledge
  -> memory
  -> skills
  -> scripts
  -> runtime
```

## Technology Stack

### Frontend

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS v4
- Shadcn/UI

### Backend

- Node.js 22
- Next.js API Routes and Server Actions
- Prisma
- NextAuth v5

### Infrastructure

- Kubernetes
- PostgreSQL via KubeBlocks
- ttyd web terminal
- FileBrowser
- GitHub App integration

## Local Development

### Prerequisites

- Node.js 22.12.0 or higher
- pnpm 10.20.0
- PostgreSQL database
- Kubernetes cluster with KubeBlocks installed
- GitHub App and OAuth application credentials

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
pnpm dev              # Start development server
pnpm build            # Build for production
pnpm lint             # Run ESLint
pnpm test             # Run tests
npx prisma generate   # Generate Prisma client
npx prisma db push    # Push schema to database
```

## Repository Documentation

This repository intentionally does not maintain a hand-written `docs/` tree on
the active v3 line. Generated repository documentation is kept under
[.qoder/repowiki](./.qoder/repowiki) and can be regenerated as the code changes.

Durable release history lives in GitHub Releases, starting with
[Fulling v2.0.0](https://github.com/FullAgent/fulling/releases/tag/v2.0.0).

## Security Model

- Multi-provider authentication through NextAuth
- User-specific Kubernetes access through scoped kubeconfig
- User-specific namespaces for isolation
- HTTP Basic Auth protection for ttyd
- Secrets stored as project or user configuration
- Resource limits for sandbox workloads

## License

MIT License - see [LICENSE](LICENSE).

## Acknowledgments

- [Anthropic](https://www.anthropic.com/) for Claude Code
- [Sealos](https://sealos.io/) for Kubernetes platform
- [ttyd](https://github.com/tsl0922/ttyd) for web terminal
- [FileBrowser](https://github.com/filebrowser/filebrowser) for file management

## Contact

- GitHub: [@fanux](https://github.com/fanux)
- Issues: [GitHub Issues](https://github.com/FullAgent/fulling/issues)
