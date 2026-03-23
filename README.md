# Fulling - AI-Powered Full-Stack Development Platform

<div align="center">
  <img src="https://img.shields.io/badge/v2.0.0--dev-yellow?style=for-the-badge" alt="Version 2.0.0-dev"/>
  <img src="https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js" alt="Next.js"/>
  <img src="https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript" alt="TypeScript"/>
  <img src="https://img.shields.io/badge/PostgreSQL-14-blue?style=for-the-badge&logo=postgresql" alt="PostgreSQL"/>
  <img src="https://img.shields.io/badge/Kubernetes-1.28-326ce5?style=for-the-badge&logo=kubernetes" alt="Kubernetes"/>
  <img src="https://img.shields.io/badge/Claude_Code-AI-purple?style=for-the-badge" alt="Claude Code"/>
</div>

> [!CAUTION]
> **v2 development in progress**
>
> We're rearchitecting Fulling as an Agentic app. Breaking changes expected.
>
> For stable, use [`v1.0.0`](https://github.com/FullAgent/fulling/tree/v1.0.0).

## What is Fulling?

**Fulling lets you focus on coding. AI handles everything else.**

Import your project from GitHub or start fresh. Claude Code is your AI pair programmer—it writes code, runs tests, manages databases, and deploys to production. All in a browser-based development environment.

**Configuration-driven development.** Need Stripe? OAuth? Just enter your API keys in project settings. Services become instantly available—no SDK setup, no environment variables, no integration code. Claude Code reads your config and implements the features for you.

## Overview

Fulling provides a sandboxed environment with Claude Code and PostgreSQL — everything you need to vibe code full-stack apps.

Fulling automatically sets up everything you need, ready in a minute:
- AI pair programmer (Claude Code)
- Full-stack development environment
- Dedicated database (PostgreSQL)
- Web terminal & file manager
- Live HTTPS domains

![fulling-frame](https://github.com/user-attachments/assets/5b535c93-8bf0-4014-8984-ef835d548dbc)

![fulling-desktop](https://github.com/user-attachments/assets/91b40df8-79de-4922-8627-822b98768915)

### Features

- **AI Pair Programmer** - Claude Code is pre-installed and ready. Describe what you want, it writes the code.

- **Zero Setup** - Full-stack environment with database, terminal, and file manager. All pre-configured, ready in seconds.

- **Web Terminal** - Full Linux terminal in your browser. Run commands, install packages, debug—everything you'd do locally.

- **File Manager** - Drag & drop files, edit code in browser. Large file support built-in.

- **Live Domains** - Your app gets HTTPS URLs instantly. No port forwarding, no ngrok. Just run and share.

- **Configuration-Driven** - Add Stripe, OAuth, or any service by entering API keys in settings. Claude Code reads your config and implements the integration for you.

- **GitHub Integration** - Import repos, push changes, version control. Works like you'd expect.

- **One-Click Deploy** - From sandbox to production in one click. No YAML, no CI/CD pipelines.

## Built With

- **Frontend**: Next.js, React, TypeScript
- **Backend**: Node.js, PostgreSQL
- **Infrastructure**: Kubernetes

For technical details, see [Architecture Documentation](./docs/architecture.md).

## Installation

### Prerequisites

- Node.js 22.9.0 or higher
- PostgreSQL database
- Kubernetes cluster with KubeBlocks installed
- GitHub OAuth application credentials

### Environment Setup

1. Clone the repository:
```bash
git clone https://github.com/FullAgent/fulling.git
cd fulling
```

2. Install dependencies:
```bash
pnpm install
```

3. Set up environment variables:

Copy `.env.template` to `.env.local` and fill in your values:
```bash
cp .env.template .env.local
```

4. Initialize database:
```bash
npx prisma generate
npx prisma db push
```

5. Run the development server:
```bash
pnpm run dev
```

Open [http://localhost:3000](http://localhost:3000) to access the application.

### Database Schema

See [Database Documentation](./docs/database.md) for schema details.

## Deployment

### Kubernetes Resources

The platform creates the following Kubernetes resources for each project:

1. **Database Cluster** (KubeBlocks):
   - PostgreSQL 14.8.0
   - 3Gi storage
   - Auto-generated credentials

2. **Sandbox StatefulSet**:
   - Custom fullstack-web-runtime image
   - Claude Code CLI pre-installed
   - ttyd web terminal (port 7681)
   - FileBrowser (port 8080)
   - Application port (3000)

3. **Services & Ingresses**:
   - Internal service for pod networking
   - HTTPS ingresses with SSL termination
   - WebSocket support for terminal

### Resource Limits

Default resource allocation per sandbox:
- CPU: 20m request, 2000m limit
- Memory: 25Mi request, 4096Mi limit
- Storage: 10Gi for sandbox, 3Gi for database

## Development

### Project Structure

```
fulling/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes
│   ├── projects/          # Project management pages
│   └── layout.tsx         # Root layout
├── components/            # React components
│   ├── ui/               # Shadcn/UI components
│   └── terminal/         # Terminal components
├── lib/                   # Core libraries
│   ├── k8s/              # Kubernetes managers
│   ├── events/           # Event system
│   ├── jobs/             # Background jobs
│   ├── repo/             # Repository layer
│   └── services/         # Business services
├── prisma/               # Database schema
├── runtime/              # Docker image for sandboxes
└── docs/                 # Documentation
```

### Key Services

- **SandboxManager** (`lib/k8s/sandbox-manager.ts`) - StatefulSet operations
- **DatabaseManager** (`lib/k8s/database-manager.ts`) - KubeBlocks operations
- **Authentication** (`lib/auth.ts`) - Multi-provider OAuth
- **Event Listeners** (`lib/events/`) - Lifecycle handlers

## Documentation

- [Architecture](./docs/architecture.md) - Reconciliation pattern, event system
- [Development Guide](./docs/development.md) - Local development
- [Operations Manual](./docs/operations.md) - Deployment, monitoring
- [Troubleshooting](./docs/troubleshooting.md) - Common issues

## Security

- **Authentication**: Multi-provider OAuth (GitHub, Password, Sealos)
- **Isolation**: Each sandbox runs in user-specific Kubernetes namespace
- **Terminal Auth**: HTTP Basic Auth with URL token injection
- **Secrets Management**: Sensitive data stored in Kubernetes secrets
- **Resource Limits**: Prevents resource exhaustion

## Contributing

See [Contributing Guidelines](CONTRIBUTING.md) for details.

### Development Setup

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests: `pnpm test`
5. Submit a pull request

## License

MIT License - see [LICENSE](LICENSE).

See [CHANGELOG.md](CHANGELOG.md) for release history.

## Acknowledgments

- [Anthropic](https://www.anthropic.com/) for Claude Code
- [MiniMax](https://www.minimax.io/) for MiniMax AI models (M2.7, M2.5-highspeed)
- [Sealos](https://sealos.io/) for Kubernetes platform
- [ttyd](https://github.com/tsl0922/ttyd) for web terminal
- [FileBrowser](https://github.com/filebrowser/filebrowser) for file management

## Contact

- GitHub: [@fanux](https://github.com/fanux)
- Issues: [GitHub Issues](https://github.com/FullAgent/fulling/issues)

## Star us for latest updates

![star-demo](https://github.com/user-attachments/assets/bc497e0b-bd23-4ded-a231-1e382d56f92e)

---

<div align="center">
<strong>100% AI-generated code.</strong> Prompted by [@fanux](https://github.com/fanux).
<br>Powered by Claude Code, with models from Anthropic (Sonnet, Opus), Google (Gemini), MiniMax (M2.7), Zhipu AI (GLM), and Moonshot (Kimi).
</div>
