# GitHub App Integration Design

Date: 2026-02-25
Branch: `feat/github-app-integration`
Status: Approved

## Goals

Phase 1 (this design):
- Build GitHub App infrastructure (installation storage, token management)
- Replace existing GitHub OAuth App with GitHub App's OAuth flow
- Webhook endpoint for keeping installation data in sync

Future phases:
- Repo <-> Sandbox bidirectional sync
- Webhook-driven deployment (push/PR events trigger sandbox updates)

## Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| App ownership | Platform-owned single GitHub App | Like Vercel/Railway model, simplest for users |
| Schema approach | Normalized (dedicated models) | Webhook lookups, repo-project linking, data integrity |
| Project-Repo relation | One repo can be linked by multiple projects | Different branches -> different projects |
| Token storage | Installation tokens in memory cache, user tokens in UserIdentity.metadata | Installation tokens are short-lived (1h), no DB needed |
| OAuth replacement | Swap client_id/secret in env vars | GitHub App OAuth is compatible with OAuth App flow, zero code change |
| Migration | Additive (keep old `githubRepo` field temporarily) | Zero-downtime, remove later |

## Schema Changes

### New Enum

```prisma
enum GitHubInstallationStatus {
  ACTIVE
  SUSPENDED
  DELETED
}
```

### New Model: GitHubAppInstallation

Tracks each installation of the platform's GitHub App on a user's account or organization.

```prisma
model GitHubAppInstallation {
  id                  String                   @id @default(cuid())
  installationId      Int                      @unique  // GitHub's installation ID
  userId              String

  // GitHub account where the app is installed
  accountId           Int
  accountLogin        String
  accountType         String   // "User" | "Organization"
  accountAvatarUrl    String?

  // Repo access scope
  repositorySelection String   // "all" | "selected"

  // Permissions and events from GitHub
  permissions         Json     @default("{}")
  events              Json     @default("[]")

  // Status
  status              GitHubInstallationStatus @default(ACTIVE)
  suspendedAt         DateTime?

  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt

  // Relations
  user                User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  repositories        GitHubRepository[]

  @@index([userId])
  @@index([accountId])
}
```

### New Model: GitHubRepository

Tracks repositories accessible via an installation. Serves as the link between GitHub repos and platform projects.

```prisma
model GitHubRepository {
  id               String   @id @default(cuid())
  installationId   String

  // GitHub repo identifiers
  githubRepoId     Int
  fullName         String   // "owner/repo-name"
  name             String   // "repo-name"
  ownerLogin       String   // "owner"

  // Repo metadata
  private          Boolean  @default(false)
  defaultBranch    String   @default("main")
  description      String?
  htmlUrl          String?

  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  // Relations
  installation     GitHubAppInstallation @relation(fields: [installationId], references: [id], onDelete: Cascade)
  projects         Project[]

  @@unique([installationId, githubRepoId])
  @@index([fullName])
  @@index([githubRepoId])
}
```

### Modified Model: Project

Replace the loose `githubRepo` string with a proper relation. Add `githubBranch` to support multiple projects on the same repo with different branches.

```prisma
model Project {
  // Keep temporarily for migration:
  // githubRepo  String?

  // New fields:
  githubRepositoryId String?
  githubBranch       String?           // Defaults to repo's defaultBranch
  githubRepository   GitHubRepository? @relation(fields: [githubRepositoryId], references: [id], onDelete: SetNull)

  @@index([githubRepositoryId])
}
```

`onDelete: SetNull` - deleting a repo record unlinks projects, does not cascade-delete them.

### Modified Model: User

Add relation to installations.

```prisma
model User {
  // New:
  githubInstallations GitHubAppInstallation[]
}
```

## Core Flows

### Flow 1: GitHub App Installation

```
User clicks "Connect GitHub"
  -> Redirect to https://github.com/apps/{app-name}/installations/new
  -> User selects repos, confirms installation
  -> GitHub redirects to /api/github/callback?installation_id=xxx&setup_action=install
  -> Callback handler:
      1. Call GitHub API to get installation details
      2. Create GitHubAppInstallation record
      3. Fetch accessible repos, create GitHubRepository records
      4. Redirect to frontend settings page
```

### Flow 2: OAuth Replacement

No code changes needed. Swap environment variables:

```
GITHUB_CLIENT_ID     -> GitHub App's client ID
GITHUB_CLIENT_SECRET -> GitHub App's client secret
```

GitHub App's OAuth flow is wire-compatible with OAuth App. The existing NextAuth GitHub provider works as-is.

### Flow 3: Webhook Sync

```
POST /api/github/webhook (verify signature with GITHUB_APP_WEBHOOK_SECRET)
  installation.created       -> Create/update Installation record
  installation.deleted       -> Set status=DELETED
  installation.suspended     -> Set status=SUSPENDED
  installation.unsuspended   -> Set status=ACTIVE
  installation_repositories.added   -> Create GitHubRepository records
  installation_repositories.removed -> Delete GitHubRepository records
```

### Flow 4: Installation Token Service

```typescript
// lib/services/github-app.ts
class GitHubAppService {
  // Generate JWT from APP_ID + PRIVATE_KEY
  // Exchange JWT + installationId for installation access token
  // In-memory cache with TTL = 50min (token valid for 60min)
  async getInstallationToken(installationId: number): Promise<string>

  // List repos accessible by an installation
  async getInstallationRepos(installationId: number): Promise<Repo[]>

  // Verify webhook signature
  verifyWebhookSignature(payload: string, signature: string): boolean
}
```

## Environment Variables (New)

```
GITHUB_APP_ID              # GitHub App ID (number)
GITHUB_APP_PRIVATE_KEY     # GitHub App private key (PEM format)
GITHUB_APP_WEBHOOK_SECRET  # Webhook signature verification secret
# GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET reused, swapped to GitHub App values
```

## File Structure (New/Modified)

New files:
- `lib/services/github-app.ts` - Core GitHub App service (JWT, token cache, webhook verification)
- `lib/repo/github.ts` - Repository layer for GitHub models (CRUD)
- `app/api/github/callback/route.ts` - Installation callback handler
- `app/api/github/webhook/route.ts` - Webhook endpoint

Modified files:
- `prisma/schema.prisma` - New models + Project modification
- `lib/env.ts` - New environment variables
- `lib/auth.ts` - Scope adjustments if needed

## Migration Strategy

1. Add new fields (`githubRepositoryId`, `githubBranch`) to Project
2. Keep old `githubRepo` field temporarily
3. After all projects migrate to the new relation, remove `githubRepo` in a future release
