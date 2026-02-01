# Fulling - AI-Powered Full-Stack Development Platform

<div align="center">
  <img src="https://img.shields.io/badge/v1.0.0-stable-green?style=for-the-badge" alt="Version 1.0.0"/>
  <img src="https://img.shields.io/badge/Next.js-16.0.10-black?style=for-the-badge&logo=next.js" alt="Next.js"/>
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

## Overview

Fulling provides a sandboxed environment with Claude Code and PostgreSQL — everything you need to vibe code full-stack apps.

Fulling automatically sets up the following for your project, ready in a minute:
- Next.js environment with shadcn/ui
- Dedicated PostgreSQL (pre-configured)
- Claude Code (pre-configured)
- A live domain

![fulling-frame](https://github.com/user-attachments/assets/5b535c93-8bf0-4014-8984-ef835d548dbc)

![fulling-desktop](https://github.com/user-attachments/assets/91b40df8-79de-4922-8627-822b98768915)


### Features

- **Dev environment** - Next.js + shadcn/ui + Claude Code CLI, all pre-configured. Environment variables are set up, so you can start coding immediately.

- **Database** - Each project gets its own PostgreSQL instance via KubeBlocks. Connection string is injected as `DATABASE_URL`.

- **Live domains** - HTTPS subdomains with SSL, mapped to ports 3000/5000/8080. Your app is accessible the moment you run it.

- **Web terminal** - Built-in ttyd terminal. Chat with Claude Code, run commands, see output—all in your browser.

- **Config awareness** - Set up OAuth or payment configs in the UI. Claude Code can read these and implement the features for you.

- **GitHub sync** - Connect your repo. Push, pull, version control—works like you'd expect.

- **One-click deploy** - Deploy from sandbox to production Kubernetes. No YAML wrangling required.

## Star us for latest updates

![star-demo](https://github.com/user-attachments/assets/bc497e0b-bd23-4ded-a231-1e382d56f92e)

## Tech Stack

### Frontend
- **Framework**: Next.js 16.0.10 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **UI Components**: Shadcn/UI
- **State Management**: React Hooks

### Backend
- **Runtime**: Node.js
- **API**: Next.js API Routes
- **Database ORM**: Prisma
- **Authentication**: NextAuth v5 with GitHub OAuth

### Infrastructure
- **Container Orchestration**: Kubernetes
- **Database**: PostgreSQL (via KubeBlocks)
- **Web Terminal**: ttyd
- **Container Image**: fullstack-web-runtime (Custom Docker image with development tools)

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

Create `.env.local` file:
```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/fullstackagent"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-nextauth-secret"
AUTH_TRUST_HOST=""

# GitHub OAuth (replace with your actual values)
GITHUB_CLIENT_ID=""
GITHUB_CLIENT_SECRET=""

# Sealos OAuth
SEALOS_JWT_SECRET=""

# job
DATABASE_LOCK_DURATION_SECONDS=""
MAX_DATABASES_PER_RECONCILE=""

SANDBOX_LOCK_DURATION_SECONDS=""
MAX_SANDBOXES_PER_RECONCILE=""

# k8s resource
RUNTIME_IMAGE=""

# aiproxy
AIPROXY_ENDPOINT=""
ANTHROPIC_BASE_URL=""

# Log
LOG_LEVEL="info"

# login
ENABLE_SEALOS_AUTH=""
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

prisma/schema.prisma

## Deployment

### Kubernetes Resources

The platform creates the following Kubernetes resources for each project:

1. **Database Cluster** (KubeBlocks):
   - PostgreSQL 14.8.0
   - 3Gi storage
   - Auto-generated credentials

2. **Sandbox Deployment**:
   - Custom fullstack-web-runtime image
   - Claude Code CLI pre-installed
   - Web terminal (ttyd) on port 7681
   - Application ports: 3000, 5000, 8080

3. **Services & Ingress**:
   - Internal service for pod networking
   - HTTPS ingress with SSL termination
   - WebSocket support for terminal

### Resource Limits

Default resource allocation per sandbox:
- CPU: 200m limit, 20m request
- Memory: 256Mi limit, 25Mi request
- Storage: 3Gi for database

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
│   └── ...               # Feature components
├── lib/                   # Core libraries
│   ├── auth.ts           # NextAuth configuration
│   ├── db.ts             # Prisma client
│   ├── kubernetes.ts     # Kubernetes service
│   └── github.ts         # GitHub integration
├── prisma/               # Database schema
├── yaml/                 # Kubernetes templates
└── public/               # Static assets
```

### Key Services

#### KubernetesService (`lib/kubernetes.ts`)
- Manages all Kubernetes operations
- Creates databases and sandboxes
- Handles pod lifecycle management

#### Authentication (`lib/auth.ts`)
- GitHub OAuth integration
- Session management
- User authorization

#### Database (`lib/db.ts`)
- Prisma ORM configuration
- Connection pooling

## Security

- **Authentication**: GitHub OAuth ensures only authorized users can access the platform
- **Isolation**: Each sandbox runs in its own Kubernetes namespace
- **Secrets Management**: Sensitive data stored in Kubernetes secrets
- **Network Policies**: Sandboxes isolated from each other
- **Resource Limits**: Prevents resource exhaustion attacks

## Contributing

See [Contributing Guidelines](CONTRIBUTING.md) for details.

### Development Setup

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests: `npm test`
5. Submit a pull request

## License

MIT License - see [LICENSE](LICENSE).

See [CHANGELOG.md](CHANGELOG.md) for release history.

## Acknowledgments

- [Anthropic](https://www.anthropic.com/) for Claude Code
- [Sealos](https://sealos.io/) for Kubernetes platform
- [ttyd](https://github.com/tsl0922/ttyd) for web terminal

## Contact

- GitHub: [@fanux](https://github.com/fanux)
- Issues: [GitHub Issues](https://github.com/FullAgent/fulling/issues)

---

<div align="center">
100% AI-generated code. Prompted by fanux. Thanks for Claude code & Opus & Sonnet 4.5 & GLM & Kimi K2 Thinking
</div>
