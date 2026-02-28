# GitHub App 集成 — 实施计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**目标：** 为平台接入 GitHub App 基础设施 — installation 跟踪、token 管理、webhook 同步，替代现有的 GitHub OAuth 方式操作 repo。

**核心设计决策（经讨论确认）：**

1. **保留 `GitHubAppInstallation` 模型** — 拿 installation token 必须记录 installationId
2. **不建 `GitHubRepository` 表** — repo 列表从 GitHub API 实时获取，避免无 webhook 时的数据过期问题（YAGNI）
3. **Project 上存三个 GitHub 字段** — `githubAppInstallationId`（FK）、`githubRepoId`、`githubRepoFullName`，通过 FK 关联 installation，`onDelete: SetNull`
4. **不存 `githubBranch`** — 默认使用 repo 的 default branch（通常是 main），分支管理交给用户在 sandbox 中自行决定
5. **保留旧字段 `githubRepo`（deprecated）** — 生产环境已有数据，采用 expand-contract 迁移策略
6. **`updateInstallationStatus` 防御性处理** — 捕获 Prisma P2025（记录不存在），webhook 收到 deleted/suspend 事件时不因 DB 无记录而崩溃
7. **PEM 私钥格式兼容** — `generateAppJWT()` 通过 `resolvePrivateKey()` 兼容 base64 编码和 `\n` 转义两种部署格式
8. **Callback 所有权校验** — 校验 installation 的 `account.id` 与当前用户的 GitHub identity 匹配，防止攻击者用他人的 `installation_id` 冒领。当前只支持 User 类型 installation，Organization 类型留后续版本
9. **Phase 1 不勾选 "Request user authorization (OAuth) during installation"** — 渐进式迁移，保留现有 GitHub OAuth 流程。详见下方「身份验证 vs 授权」章节

**用户流程与前置依赖：**

```
绑定 GitHub（OAuth）→ 安装 GitHub App → 选择 repo 关联到项目
UserIdentity        → GitHubAppInstallation → Project.githubRepoId
```

- **绑定 GitHub 身份**：继续使用现有 OAuth 设施（`UserIdentity(provider=GITHUB)`），不需要改动
- **安装 GitHub App**：新流程，用户必须先绑定 GitHub 身份才能安装（callback 路由校验 `UserIdentity` 存在性）
- **关联 repo 到项目**：需要新的前端界面（repo 选择器），属于 Phase 2 范围

---

### 身份验证 vs 授权（重要）

**背景**：GitHub App 可以勾选 "Request user authorization (OAuth) during installation"，在安装 App 时同时完成用户身份验证（获取 user access token）。

**Phase 1 设计（当前）**：

```
┌─────────────────┐     ┌─────────────────┐
│  GitHub OAuth   │     │  GitHub App     │
│  (身份验证)      │     │  (授权 repo)    │
│                 │     │                 │
│  read:user      │     │  contents,      │
│  权限           │     │  pull_requests  │
└────────┬────────┘     └────────┬────────┘
         │                       │
         ▼                       ▼
   UserIdentity            GitHubAppInstallation
   (用户身份)               (repo 操作权限)
```

- **不勾选** "Request user authorization (OAuth) during installation"
- 保留独立的 GitHub OAuth 绑定流程
- 用户可以先绑定身份，稍后再安装 App
- 降低迁移风险，向后兼容现有用户

**Phase 2+ 设计（未来目标，类似 Vercel）**：

```
┌─────────────────────────────────────────┐
│         GitHub App Installation         │
│         (勾选 OAuth during install)      │
│                                         │
│  同时获取：                              │
│  - user access token (身份)             │
│  - installation token (repo 权限)       │
└──────────────────┬──────────────────────┘
                   │
         ┌─────────┴─────────┐
         ▼                   ▼
   UserIdentity      GitHubAppInstallation
   (自动创建)          (自动创建)
```

- **勾选** "Request user authorization (OAuth) during installation"
- 安装 App 时自动完成身份绑定
- 废弃独立的 GitHub OAuth 绑定入口（保留旧数据）
- 简化用户流程：一步完成身份验证 + 授权

**为什么 Phase 1 不直接采用最终设计？**

| 原因 | 说明 |
|------|------|
| 渐进式迁移 | 避免一次性改动太大，降低风险 |
| 向后兼容 | 已绑定 GitHub 身份的用户不受影响 |
| 职责分离 | Phase 1 只添加基础设施，不改变现有流程 |
| 测试窗口 | 可以在 Phase 2 前验证后端基础设施的稳定性 |

**迁移时机**：Phase 2 前端开发时，可以：
1. 在 GitHub App 设置中勾选 "Request user authorization (OAuth) during installation"
2. 修改 callback 路由，同时处理 user token 和 installation
3. 废弃独立的 GitHub OAuth 绑定入口

**迁移策略（分阶段交付）：**

| 阶段 | 范围 | 内容 | 时机 |
|------|------|------|------|
| **Phase 1: 后端基础设施** | 本次 PR | Schema（expand）、Service 层、Repo 层、Callback/Webhook 路由、构建验证 | 当前 |
| **Phase 2: 前端界面** | 独立 PR | GitHub App 安装入口、repo 选择器、项目关联/解绑 UI、改造现有 GitHub 页面 | Phase 1 合并后 |
| **Phase 3: 数据迁移** | 独立 PR | 用户通过新流程重新关联 repo 时填充新字段；旧 `githubRepo` 字段无法自动迁移（只是字符串，缺少 `githubRepoId` 和 `installationId`） | Phase 2 上线后 |
| **Phase 4: 清理** | 独立 PR | 确认所有项目已迁移或旧数据不再需要后，移除 `githubRepo` 字段 | 未来版本 |

**分支策略：**

`feat/github-app-integration` 作为集成分支，每个 Phase 从该分支开子分支，完成后 PR 回集成分支。全部 Phase 完成并在集成分支上测试通过后，PR 到 `main`。

```
main
  └── feat/github-app-integration（集成分支）
        ├── feat/github-app-integration/phase-1 → PR to 集成分支
        ├── feat/github-app-integration/phase-2 → PR to 集成分支
        └── ...
最终：feat/github-app-integration → PR to main
```

**技术栈：** Prisma ORM（使用 `prisma migrate`）, Next.js 15 App Router, `jsonwebtoken`（已安装）, GitHub REST API v3

---

### Task 0: 在 GitHub 上创建和配置 GitHub App（手动操作）

> 这是一个手动配置步骤，不涉及代码。需要在代码实施之前完成，以获取环境变量所需的值。

**Step 1: 创建 GitHub App**

前往 `GitHub Settings → Developer settings → GitHub Apps → New GitHub App`，填写：

| 配置项 | 值 |
|--------|-----|
| App name | `FullstackAgent`（或你想要的名字） |
| Homepage URL | 你的平台域名 |
| Callback URL | `https://<your-domain>/api/github/app/callback` |
| Setup URL (optional) | 同上，勾选 "Redirect on update" |
| Webhook URL | `https://<your-domain>/api/github/app/webhook` |
| Webhook secret | 生成一个随机字符串（`openssl rand -hex 32`） |

**Step 2: 配置权限**

在 "Permissions" 部分，按需开启（建议最小权限）：

| 权限类别 | 权限 | 级别 |
|----------|------|------|
| Repository | Contents | Read & Write |
| Repository | Pull requests | Read & Write |
| Repository | Actions | Read & Write |
| Repository | Metadata | Read-only（默认） |

**Step 3: 订阅事件**

在 "Subscribe to events" 部分勾选：
- `Installation`（App 安装/卸载/暂停）

**Step 4: 生成私钥**

创建完成后，在 App 设置页面底部点击 "Generate a private key"，下载 `.pem` 文件。

**Step 5: 记录环境变量**

从 App 设置页面获取以下值，配置到 `.env`：

```bash
GITHUB_APP_ID=<App 设置页顶部的 App ID>
GITHUB_APP_PRIVATE_KEY=<.pem 文件内容，保留换行符；或 base64 编码后的字符串（resolvePrivateKey 会自动识别）>
GITHUB_APP_WEBHOOK_SECRET=<Step 1 中生成的 webhook secret>
```

---

### Task 1: Prisma Schema — 新增枚举和模型，修改 Project

**文件：**
- 修改: `prisma/schema.prisma`

**Step 1: 新增 `GitHubInstallationStatus` 枚举**

在 `AuthProvider` 枚举之后添加：

```prisma
enum GitHubInstallationStatus {
  ACTIVE
  SUSPENDED
  DELETED
}
```

**Step 2: 新增 `GitHubAppInstallation` 模型**

```prisma
model GitHubAppInstallation {
  id                  String                   @id @default(cuid())
  installationId      Int                      @unique  // GitHub 的数字 installation ID
  userId              String

  accountId           Int                      // GitHub account 数字 ID
  accountLogin        String                   // GitHub 用户名或组织名
  accountType         String                   // "User" 或 "Organization"
  accountAvatarUrl    String?

  repositorySelection String                   // "all" 或 "selected"

  permissions         Json     @default("{}")  // App 拥有的权限
  events              Json     @default("[]")  // App 订阅的事件

  status              GitHubInstallationStatus @default(ACTIVE)
  suspendedAt         DateTime?

  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt

  user                User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  projects            Project[] // 反向关联：哪些项目使用了这个 installation

  @@index([userId])
  @@index([accountId])
}
```

**Step 3: 修改 `User` 模型 — 添加反向关联**

在 `configs` 关联之后添加：

```prisma
  githubInstallations GitHubAppInstallation[]
```

**Step 4: 修改 `Project` 模型 — 添加新字段，保留旧字段**

保留旧字段并标记 deprecated：
```prisma
  /// @deprecated 使用 githubAppInstallation + githubRepoId + githubRepoFullName 替代，将在 Phase 3 移除
  githubRepo  String? // Optional GitHub repository (legacy)
```

添加新字段（在 `githubRepo` 之后）：
```prisma
  // GitHub App 集成（Phase 1: Expand）
  githubAppInstallationId String?   // FK → GitHubAppInstallation
  githubRepoId            Int?      // GitHub repo 数字 ID（rename 不变）
  githubRepoFullName      String?   // "owner/repo-name"，显示用

  githubAppInstallation   GitHubAppInstallation? @relation(fields: [githubAppInstallationId], references: [id], onDelete: SetNull)
```

在 Project 的 `@@` 指令区域添加索引：
```prisma
  @@index([githubAppInstallationId])
```

**Step 5: 生成迁移文件并应用**

```bash
npx prisma format
npx prisma migrate dev --name add-github-app-installation
```

这会生成一个迁移文件，内容为纯加法操作：新增枚举、新增表、新增 nullable 列。不会删除任何现有数据。

**Step 6: 提交**

```bash
git add prisma/
git commit -m "feat(schema): add GitHubAppInstallation model, expand Project with GitHub fields"
```

---

### Task 2: 环境变量

**文件：**
- 修改: `lib/env.ts`

**Step 1: 在 server schema 中添加 GitHub App 环境变量**

在现有的 GitHub OAuth 条目之后添加：

```typescript
    // GitHub App credentials
    GITHUB_APP_ID: z.string().optional(),
    GITHUB_APP_PRIVATE_KEY: z.string().optional(),
    GITHUB_APP_WEBHOOK_SECRET: z.string().optional(),
```

**Step 2: 验证**

```bash
pnpm lint
```

**Step 3: 提交**

```bash
git add lib/env.ts
git commit -m "feat(env): add GitHub App environment variables"
```

---

### Task 3: GitHub App Service — JWT、Token 缓存、Webhook 验证

**文件：**
- 新建: `lib/services/github-app.ts`

**Step 1: 创建 service 文件**

参考 `lib/services/aiproxy.ts` 的模式。需要实现：

1. `generateAppJWT()` — 用 App 私钥签发 JWT（10 分钟有效期）
2. `getInstallationToken(installationId)` — 用 JWT 换取 installation access token，内存缓存（50 分钟 TTL）
3. `getInstallationDetails(installationId)` — 从 GitHub API 获取 installation 信息
4. `listInstallationRepos(installationId)` — 列出 installation 可访问的 repo（实时获取，不存库）
5. `verifyWebhookSignature(payload, signature)` — HMAC-SHA256 签名验证

```typescript
import crypto from 'crypto'
import jwt from 'jsonwebtoken'

import { env } from '@/lib/env'
import { logger as baseLogger } from '@/lib/logger'

const logger = baseLogger.child({ module: 'lib/services/github-app' })

const GITHUB_API_BASE = 'https://api.github.com'

// 内存 token 缓存: installationId -> { token, expiresAt }
const tokenCache = new Map<number, { token: string; expiresAt: number }>()

// 缓存 TTL: 50 分钟（token 有效期 60 分钟，留 10 分钟缓冲）
const TOKEN_CACHE_TTL_MS = 50 * 60 * 1000

/**
 * 解析 PEM 私钥：兼容 base64 编码和 .env 转义换行两种格式。
 * - 如果内容不含 "-----BEGIN"，尝试 base64 decode
 * - 处理 .env 文件中 \\n 被当作字面量的情况
 */
function resolvePrivateKey(raw: string): string {
  if (!raw.includes('-----BEGIN')) {
    const decoded = Buffer.from(raw, 'base64').toString('utf-8')
    if (decoded.includes('-----BEGIN')) {
      return decoded
    }
  }
  return raw.replace(/\\n/g, '\n')
}

function generateAppJWT(): string {
  const appId = env.GITHUB_APP_ID
  const rawKey = env.GITHUB_APP_PRIVATE_KEY

  if (!appId || !rawKey) {
    throw new Error('GITHUB_APP_ID and GITHUB_APP_PRIVATE_KEY must be configured')
  }

  const privateKey = resolvePrivateKey(rawKey)
  const now = Math.floor(Date.now() / 1000)

  return jwt.sign(
    {
      iat: now - 60,       // 回拨 60 秒，容忍时钟偏差
      exp: now + 10 * 60,  // 10 分钟有效期
      iss: appId,
    },
    privateKey,
    { algorithm: 'RS256' }
  )
}

export async function getInstallationToken(installationId: number): Promise<string> {
  const cached = tokenCache.get(installationId)
  if (cached && cached.expiresAt > Date.now()) {
    return cached.token
  }

  const appJwt = generateAppJWT()

  const response = await fetch(
    `${GITHUB_API_BASE}/app/installations/${installationId}/access_tokens`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${appJwt}`,
        Accept: 'application/vnd.github.v3+json',
      },
    }
  )

  if (!response.ok) {
    const errorText = await response.text()
    logger.error(`Failed to get installation token for ${installationId}: ${response.status} ${errorText}`)
    throw new Error(`Failed to get installation token: ${response.status}`)
  }

  const data = await response.json()
  const token = data.token as string

  tokenCache.set(installationId, {
    token,
    expiresAt: Date.now() + TOKEN_CACHE_TTL_MS,
  })

  logger.info(`Installation token generated for installation ${installationId}`)
  return token
}

export function invalidateInstallationToken(installationId: number): void {
  tokenCache.delete(installationId)
}

export async function getInstallationDetails(installationId: number) {
  const appJwt = generateAppJWT()

  const response = await fetch(
    `${GITHUB_API_BASE}/app/installations/${installationId}`,
    {
      headers: {
        Authorization: `Bearer ${appJwt}`,
        Accept: 'application/vnd.github.v3+json',
      },
    }
  )

  if (!response.ok) {
    const errorText = await response.text()
    logger.error(`Failed to get installation details for ${installationId}: ${response.status} ${errorText}`)
    throw new Error(`Failed to get installation details: ${response.status}`)
  }

  return response.json()
}

export async function listInstallationRepos(installationId: number) {
  const token = await getInstallationToken(installationId)
  const repos = []
  let page = 1
  const perPage = 100

  while (true) {
    const response = await fetch(
      `${GITHUB_API_BASE}/installation/repositories?per_page=${perPage}&page=${page}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github.v3+json',
        },
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      logger.error(`Failed to list installation repos: ${response.status} ${errorText}`)
      throw new Error(`Failed to list installation repos: ${response.status}`)
    }

    const data = await response.json()
    repos.push(...data.repositories)

    if (data.repositories.length < perPage) break
    page++
  }

  return repos
}

export function verifyWebhookSignature(payload: string, signature: string): boolean {
  const secret = env.GITHUB_APP_WEBHOOK_SECRET
  if (!secret) {
    logger.error('GITHUB_APP_WEBHOOK_SECRET is not configured')
    return false
  }

  const expectedSignature =
    'sha256=' + crypto.createHmac('sha256', secret).update(payload).digest('hex')

  const expected = Buffer.from(expectedSignature)
  const received = Buffer.from(signature)

  if (expected.byteLength !== received.byteLength) {
    return false
  }

  return crypto.timingSafeEqual(expected, received)
}
```

**Step 2: 验证并提交**

```bash
pnpm lint
git add lib/services/github-app.ts
git commit -m "feat: add GitHub App service with JWT, token cache, and webhook verification"
```

---

### Task 4: Repository 层 — Installation CRUD

**文件：**
- 新建: `lib/repo/github.ts`

**Step 1: 创建 repository 层**

参考 `lib/repo/sandbox.ts` 和 `lib/repo/environment.ts` 的模式。

注意：因为我们不建 `GitHubRepository` 表，这个文件只处理 `GitHubAppInstallation` 的 CRUD，以及 Project 上 GitHub 字段的更新。

```typescript
import type { GitHubInstallationStatus } from '@prisma/client'
import { Prisma } from '@prisma/client'

import { prisma } from '@/lib/db'
import { logger as baseLogger } from '@/lib/logger'

const logger = baseLogger.child({ module: 'lib/repo/github' })

// ─── Installation CRUD ───

export async function upsertInstallation(data: {
  installationId: number
  userId: string
  accountId: number
  accountLogin: string
  accountType: string
  accountAvatarUrl?: string | null
  repositorySelection: string
  permissions?: Record<string, string>
  events?: string[]
}) {
  return prisma.gitHubAppInstallation.upsert({
    where: { installationId: data.installationId },
    create: {
      installationId: data.installationId,
      userId: data.userId,
      accountId: data.accountId,
      accountLogin: data.accountLogin,
      accountType: data.accountType,
      accountAvatarUrl: data.accountAvatarUrl,
      repositorySelection: data.repositorySelection,
      permissions: data.permissions ?? {},
      events: data.events ?? [],
    },
    update: {
      accountLogin: data.accountLogin,
      accountAvatarUrl: data.accountAvatarUrl,
      repositorySelection: data.repositorySelection,
      permissions: data.permissions ?? {},
      events: data.events ?? [],
      status: 'ACTIVE',
      suspendedAt: null,
    },
  })
}

/**
 * 更新 installation 状态。
 * 防御性处理：如果 DB 中不存在该 installation（P2025），记录警告并返回 null，不抛异常。
 * 场景：webhook 收到 deleted/suspend 事件，但 callback 从未成功写入记录。
 */
export async function updateInstallationStatus(
  installationId: number,
  status: GitHubInstallationStatus,
  suspendedAt?: Date | null
) {
  try {
    return await prisma.gitHubAppInstallation.update({
      where: { installationId },
      data: {
        status,
        suspendedAt: suspendedAt ?? (status === 'SUSPENDED' ? new Date() : null),
      },
    })
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      logger.warn(`Installation ${installationId} not found, skipping status update to ${status}`)
      return null
    }
    throw error
  }
}

export async function getInstallationByGitHubId(installationId: number) {
  return prisma.gitHubAppInstallation.findUnique({
    where: { installationId },
    include: { user: true },
  })
}

export async function getInstallationsForUser(userId: string) {
  return prisma.gitHubAppInstallation.findMany({
    where: { userId, status: 'ACTIVE' },
    orderBy: { createdAt: 'desc' },
  })
}

// ─── Project GitHub 关联 ───

export async function linkProjectToRepo(
  projectId: string,
  installationId: string,
  githubRepoId: number,
  githubRepoFullName: string
) {
  return prisma.project.update({
    where: { id: projectId },
    data: {
      githubAppInstallationId: installationId,
      githubRepoId,
      githubRepoFullName,
    },
  })
}

export async function unlinkProjectFromRepo(projectId: string) {
  return prisma.project.update({
    where: { id: projectId },
    data: {
      githubAppInstallationId: null,
      githubRepoId: null,
      githubRepoFullName: null,
    },
  })
}
```

**Step 2: 验证并提交**

```bash
pnpm lint
git add lib/repo/github.ts
git commit -m "feat: add repository layer for GitHub installations"
```

---

### Task 5: Installation Callback 路由

**文件：**
- 新建: `app/api/github/app/callback/route.ts`

**Step 1: 创建 callback handler**

处理用户安装 GitHub App 后的重定向。参考 `app/api/auth/github/callback/route.ts` 的模式。

```typescript
import { NextRequest, NextResponse } from 'next/server'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { logger as baseLogger } from '@/lib/logger'
import { upsertInstallation } from '@/lib/repo/github'
import { getInstallationDetails } from '@/lib/services/github-app'

const logger = baseLogger.child({ module: 'api/github/app/callback' })

/**
 * GET /api/github/app/callback
 * 处理 GitHub App 安装后的重定向
 * Query params: installation_id, setup_action (install|update)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      logger.warn('Unauthenticated user attempted GitHub App callback')
      return NextResponse.redirect(new URL('/login', request.url))
    }

    const searchParams = request.nextUrl.searchParams
    const installationIdStr = searchParams.get('installation_id')
    const setupAction = searchParams.get('setup_action')

    if (!installationIdStr) {
      logger.error('Missing installation_id in GitHub App callback')
      return NextResponse.redirect(new URL('/projects?error=missing_installation_id', request.url))
    }

    const installationId = parseInt(installationIdStr, 10)
    logger.info(`GitHub App callback: installation_id=${installationId}, setup_action=${setupAction}`)

    // 从 GitHub API 获取 installation 详情
    const details = await getInstallationDetails(installationId)

    // 所有权校验：确认 installation 的 GitHub account 与当前用户的 GitHub identity 匹配
    // 防止攻击者用他人的 installation_id 冒领
    if (details.account.type === 'User') {
      const githubIdentity = await prisma.userIdentity.findFirst({
        where: { userId: session.user.id, provider: 'GITHUB' },
      })

      if (!githubIdentity) {
        logger.warn(`User ${session.user.id} has no GitHub identity linked`)
        return NextResponse.redirect(new URL('/projects?error=github_not_linked', request.url))
      }

      const userGitHubId = parseInt(githubIdentity.providerUserId, 10)
      if (details.account.id !== userGitHubId) {
        logger.warn(
          `User ${session.user.id} (GitHub ID ${userGitHubId}) attempted to claim installation for ${details.account.login} (GitHub ID ${details.account.id})`
        )
        return NextResponse.redirect(new URL('/projects?error=installation_owner_mismatch', request.url))
      }
    } else {
      // Organization 类型暂不支持，留后续版本
      logger.warn(`Organization installation not supported yet: ${details.account.login}`)
      return NextResponse.redirect(new URL('/projects?error=org_installation_not_supported', request.url))
    }

    // 创建或更新 installation 记录
    await upsertInstallation({
      installationId: details.id,
      userId: session.user.id,
      accountId: details.account.id,
      accountLogin: details.account.login,
      accountType: details.account.type,
      accountAvatarUrl: details.account.avatar_url,
      repositorySelection: details.repository_selection,
      permissions: details.permissions,
      events: details.events,
    })

    logger.info(`GitHub App installed: ${details.account.login}`)

    return NextResponse.redirect(new URL('/projects?github=connected', request.url))
  } catch (error) {
    logger.error(`GitHub App callback error: ${error}`)
    return NextResponse.redirect(new URL('/projects?error=github_callback_failed', request.url))
  }
}
```

**Step 2: 验证并提交**

```bash
pnpm lint
git add app/api/github/app/callback/route.ts
git commit -m "feat: add GitHub App installation callback route"
```

---

### Task 6: Webhook 端点

**文件：**
- 新建: `app/api/github/app/webhook/route.ts`

**Step 1: 创建 webhook handler**

处理 `installation` 事件（created/deleted/suspend/unsuspend）。因为不存 repo 表，`installation_repositories` 事件暂不处理。

```typescript
import { NextRequest, NextResponse } from 'next/server'

import { logger as baseLogger } from '@/lib/logger'
import {
  getInstallationByGitHubId,
  updateInstallationStatus,
} from '@/lib/repo/github'
import {
  invalidateInstallationToken,
  verifyWebhookSignature,
} from '@/lib/services/github-app'

const logger = baseLogger.child({ module: 'api/github/app/webhook' })

/**
 * POST /api/github/app/webhook
 * 接收 GitHub App 的 webhook 事件
 */
export async function POST(request: NextRequest) {
  try {
    const payload = await request.text()
    const signature = request.headers.get('x-hub-signature-256') || ''
    const event = request.headers.get('x-github-event') || ''

    if (!verifyWebhookSignature(payload, signature)) {
      logger.warn('Invalid webhook signature')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    const body = JSON.parse(payload)
    const action = body.action as string

    logger.info(`Webhook received: ${event}.${action}`)

    if (event === 'installation') {
      await handleInstallationEvent(action, body)
    } else {
      logger.info(`Unhandled webhook event: ${event}`)
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    logger.error(`Webhook processing error: ${error}`)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function handleInstallationEvent(
  action: string,
  body: {
    installation: {
      id: number
      account: { id: number; login: string; type: string; avatar_url: string }
      repository_selection: string
      permissions: Record<string, string>
      events: string[]
    }
  }
) {
  const inst = body.installation

  switch (action) {
    case 'created': {
      // 安装事件 — callback 流程已处理，这里只做日志
      const existing = await getInstallationByGitHubId(inst.id)
      if (existing) {
        logger.info(`Installation ${inst.id} already exists (created via callback)`)
      } else {
        logger.info(`Installation ${inst.id} created via webhook (no callback user — skipping)`)
      }
      break
    }
    case 'deleted':
      await updateInstallationStatus(inst.id, 'DELETED')
      invalidateInstallationToken(inst.id)
      logger.info(`Installation ${inst.id} deleted`)
      break
    case 'suspend':
      await updateInstallationStatus(inst.id, 'SUSPENDED')
      invalidateInstallationToken(inst.id)
      logger.info(`Installation ${inst.id} suspended`)
      break
    case 'unsuspend':
      await updateInstallationStatus(inst.id, 'ACTIVE', null)
      logger.info(`Installation ${inst.id} unsuspended`)
      break
    default:
      logger.info(`Unhandled installation action: ${action}`)
  }
}
```

**Step 2: 验证并提交**

```bash
pnpm lint
git add app/api/github/app/webhook/route.ts
git commit -m "feat: add GitHub App webhook endpoint for installation events"
```

---

### Task 7: 完整构建验证

**Step 1: 生成 Prisma Client**

```bash
npx prisma generate
```

**Step 2: Lint 检查**

```bash
pnpm lint
```

**Step 3: 构建**

```bash
SKIP_ENV_VALIDATION=1 pnpm build
```

用 `SKIP_ENV_VALIDATION=1` 是因为新的环境变量在本地未配置。

**Step 4: 最终提交（如有 lint 修复）**

```bash
git add -A
git commit -m "chore: lint fixes for GitHub App integration"
```
