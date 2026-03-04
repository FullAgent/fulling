# GitHub App 集成 — 实施计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

## 📊 进度总览

| 阶段 | 状态 | 提交 | 说明 |
|------|------|------|------|
| **Phase 1: 后端基础设施** | ✅ 已完成 | `0940b1e` | Schema、Service、Repo、Callback/Webhook 路由 |
| **Phase 2: 前端界面** | ✅ 已完成 | `c022e5f` | GitHub App 安装入口、repo 选择器、设置页面 |
| **Phase 3: Octokit + 合并 OAuth** | ✅ 已完成 | - | 迁移到 Octokit，合并身份验证和授权流程，修复 OAuth token exchange |
| **Phase 4: 数据迁移** | ⏳ 待开始 | - | 用户重新关联 repo 时填充新字段 |
| **Phase 5: 清理** | ⏳ 待开始 | - | 移除 `githubRepo` 旧字段和废弃代码 |

**当前分支**: `feat/github-app-integration`

---

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

| 阶段 | 范围 | 内容 | 状态 |
|------|------|------|------|
| **Phase 1: 后端基础设施** | ✅ 已完成 | Schema（expand）、Service 层、Repo 层、Callback/Webhook 路由、构建验证 | 提交 `0940b1e` |
| **Phase 2: 前端界面** | ⏳ 待开始 | GitHub App 安装入口、repo 选择器、项目关联/解绑 UI、改造现有 GitHub 页面 | Phase 1 合并后 |
| **Phase 3: 数据迁移** | ⏳ 待开始 | 用户通过新流程重新关联 repo 时填充新字段；旧 `githubRepo` 字段无法自动迁移（只是字符串，缺少 `githubRepoId` 和 `installationId`） | Phase 2 上线后 |
| **Phase 4: 清理** | ⏳ 待开始 | 确认所有项目已迁移或旧数据不再需要后，移除 `githubRepo` 字段 | 未来版本 |

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

## Phase 1: 后端基础设施 ✅ 已完成

> **提交**: `0940b1e` | **分支**: `feat/github-app-integration`

### Task 0: 在 GitHub 上创建和配置 GitHub App ✅

> 已完成：App ID = 2970712，环境变量已配置

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

### Task 1: Prisma Schema — 新增枚举和模型，修改 Project ✅

> 已完成：新增 `GitHubInstallationStatus` 枚举、`GitHubAppInstallation` 模型、Project 新字段

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

### Task 2: 环境变量 ✅

> 已完成：添加 `GITHUB_APP_ID`、`GITHUB_APP_PRIVATE_KEY`、`GITHUB_APP_WEBHOOK_SECRET`、 `NEXT_PUBLIC_GITHUB_APP_ID`

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

**Step 2: 在 client schema 中添加公共环境变量**

```typescript
  client: {
    // ... existing client vars
    NEXT_PUBLIC_GITHUB_APP_ID: z.string().optional(),
  },
```

**Step 3: 在 experimental__runtimeEnv 中添加**

```typescript
  experimental__runtimeEnv: {
    // ... existing runtime env
    NEXT_PUBLIC_GITHUB_APP_ID: process.env.NEXT_PUBLIC_GITHUB_APP_ID,
  },
```

**说明：**

| 变量 | 类型 | 用途 |
|------|------|------|
| `GITHUB_APP_ID` | 服务端 | App 标识符，用于签发 JWT |
| `GITHUB_APP_PRIVATE_KEY` | 服务端 | App 私钥，用于签发 JWT（敏感） |
| `GITHUB_APP_WEBHOOK_SECRET` | 服务端 | Webhook 签名验证（敏感） |
| `NEXT_PUBLIC_GITHUB_APP_ID` | 客户端 | App 标识符（非敏感，可选） |
| `NEXT_PUBLIC_GITHUB_APP_NAME` | 客户端 | App 名称，用于构建安装 URL（非敏感） |

**为什么需要 `NEXT_PUBLIC_GITHUB_APP_NAME`？**
- GitHub App 安装 URL 格式：`https://github.com/apps/{app-name}/installations/new`
- `{app-name}` 是 GitHub App 的 slug（如 `fulling-dev`），不是数字 ID
- 客户端组件需要构建正确的安装 URL

**Step 4: 验证**

---

### Task 3: GitHub App Service — JWT、Token 缓存、Webhook 验证 ✅

> 已完成：`lib/services/github-app.ts`
+ 
+ 实现功能：
+ - `generateAppJWT()` — 用 App 私钥签发 JWT（10 分钟有效期）
+ - `getInstallationToken(installationId)` — 用 JWT 换取 installation access token，内存缓存（50 分钟 TTL）
+ - `getInstallationDetails(installationId)` — 从 GitHub API 获取 installation 信息
+ - `listInstallationRepos(installationId)` — 列出 installation 可访问的 repo
+ - `verifyWebhookSignature(payload, signature)` — HMAC-SHA256 签名验证
  
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

### Task 4: Repository 层 — Installation CRUD ✅

> 已完成：`lib/repo/github.ts`
+ 
+ 实现功能：
+ - `upsertInstallation()` — 创建或更新 installation
+ - `updateInstallationStatus()` — 更新状态（防御性处理 P2025）
+ - `getInstallationByGitHubId()` — 按 GitHub ID 查询
+ - `getInstallationsForUser()` — 获取用户的 installations
+ - `linkProjectToRepo()` — 关联项目到 repo
+ - `unlinkProjectFromRepo()` — 解除关联

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

### Task 5: Installation Callback 路由 ✅

> 已完成：`app/api/github/app/callback/route.ts`
+ 
+ 实现功能：
+ - 处理 GitHub App 安装后的重定向
+ - 所有权校验（防止冒领）
+ - 创建/更新 `GitHubAppInstallation` 记录

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

### Task 6: Webhook 端点 ✅

> 已完成：`app/api/github/app/webhook/route.ts`
+ 
+ 实现功能：
+ - 处理 `installation` 事件（created/deleted/suspend/unsuspend）
+ - Webhook 签名验证
+ - Installation token 缓存失效处理

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

### Task 7: 完整构建验证 ✅

> 已完成：
> - `npx prisma generate` ✅
> - `pnpm lint` ✅
> - `SKIP_ENV_VALIDATION=1 pnpm build` ✅
> - `npx prisma db push` ✅（数据库迁移）

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

---

## Phase 2: 前端界面 ⏳ 待开始

> **前置条件**: Phase 1 已合并到集成分支

### 设计决策

#### 用户流程

```
绑定 GitHub（OAuth）→ 安装 GitHub App → 选择 repo 关联到项目
UserIdentity        → GitHubAppInstallation → Project.githubRepoId
```

**为什么需要 GitHub OAuth？**
- 安全校验：callback 路由需要验证 installation 的 owner 与当前用户的 GitHub identity 匹配
- 防止冒领：防止用户用他人的 installation_id 冒领仓库权限

#### 入口设计

| 入口 | 位置 | 形式 | 用途 |
|------|------|------|------|
| **设置页面** | 全新页面 | 独立页面 | 用户主动配置 GitHub 集成 |
| **Import 按钮** | Search Bar | 弹窗 | 导入 GitHub 仓库创建项目 |

#### Import 弹窗流程

```
┌─────────────────────────────────────────┐
│           Import from GitHub            │
├─────────────────────────────────────────┤
│  Step 1: 检测 GitHub 身份               │
│  ├── 未绑定 → 显示 "Connect GitHub"     │
│  │              [Connect GitHub] 按钮   │
│  │              （跳转 GitHub OAuth）    │
│  │                                      │
│  └── 已绑定 → 进入 Step 2               │
│                                         │
│  Step 2: 检测 GitHub App                │
│  ├── 未安装 → 显示 "Install GitHub App" │
│  │              [Install] 按钮          │
│  │              （弹窗打开 GitHub 安装页）│
│  │                                      │
│  └── 已安装 → 进入 Step 3               │
│                                         │
│  Step 3: 选择仓库                       │
│  ├── 显示 repo 列表（可搜索）           │
│  ├── 选择一个 repo                      │
│  └── [Import] 创建项目                  │
│                                         │
└─────────────────────────────────────────┘
```

**弹窗实现细节：**
- 使用 `window.open()` 打开 GitHub 安装页面
- 监听弹窗关闭事件，检测安装是否完成
- 完成后刷新状态，自动进入下一步

#### Repository Access 策略

| 模式 | Phase 2 处理方式 |
|------|------------------|
| **All repositories** | ✅ 完整支持，新仓库自动可访问 |
| **Only select repositories** | 📌 后续迭代，Phase 2 暂不处理 |

**引导策略：** 在 GitHub App 安装页面文案中引导用户选择 "All repositories"

### 范围说明

**Phase 2 范围：仅实现 UI 和基础数据关联**

| 包含 | 不包含 |
|------|--------|
| ✅ GitHub 身份绑定 UI | ❌ clone 代码到 sandbox |
| ✅ GitHub App 安装 UI | ❌ 自动同步代码 |
| ✅ Repo 选择器 UI | ❌ PR 创建功能 |
| ✅ 项目与 repo 关联（数据库记录） | ❌ CI/CD 集成 |
| ✅ 基础错误处理 | ❌ 高级错误恢复 |

**后续行为留待后续迭代实现。**

---

### Task 1: Server Actions — 基础数据获取 ✅

> **目标**: 创建 GitHub 相关的 Server Actions，供前端组件调用

**文件：**
- 新建: `lib/actions/github.ts`

**Step 1: 创建 `getInstallations()` Action**

```typescript
'use server'

import { auth } from '@/lib/auth'
import { getInstallationsForUser } from '@/lib/repo/github'

export async function getInstallations() {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error('Unauthorized')
  }

  return getInstallationsForUser(session.user.id)
}
```

**Step 2: 创建 `getInstallationRepos(installationId)` Action**

```typescript
export async function getInstallationRepos(installationId: string) {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error('Unauthorized')
  }

  // 验证 installation 归属
  const installation = await getInstallationByGitHubId(parseInt(installationId, 10))
  if (!installation || installation.userId !== session.user.id) {
    throw new Error('Installation not found')
  }

  return listInstallationRepos(installation.installationId)
}
```

**Step 3: 验证并提交**

```bash
pnpm lint
git add lib/actions/github.ts
git commit -m "feat(actions): add GitHub Server Actions for installations and repos"
```

---

### Task 2: 设置页面 — GitHub 集成 ✅

> **目标**: 创建全新的设置页面，显示 GitHub 身份和 installations 状态

**文件：**
- 新建: `app/settings/page.tsx`
- 新建: `components/github/github-status-card.tsx`
- 新建: `components/github/installation-list.tsx`

**Step 1: 创建设置页面路由**

```typescript
// app/settings/page.tsx
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import GitHubStatusCard from '@/components/github/github-status-card'

export default async function SettingsPage() {
  const session = await auth()
  if (!session?.user?.id) {
    redirect('/login')
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>
      <GitHubStatusCard userId={session.user.id} />
    </div>
  )
}
```

**Step 2: 创建 GitHub 状态卡片组件**

显示：
- GitHub 身份绑定状态（已绑定/未绑定）
- "Connect GitHub" 按钮（未绑定时）
- 已安装的 installations 列表
- "Install GitHub App" 按钮

**Step 3: 创建 Installation 列表组件**

显示：
- Installation 账户信息（头像、用户名）
- Repository selection 类型（all/selected）
- 状态（ACTIVE/SUSPENDED）

**Step 4: 验证并提交**

```bash
pnpm lint
git add app/settings/ components/github/
git commit -m "feat(ui): add settings page with GitHub integration status"
```

---

### Task 3: Import 弹窗 — 三步流程 ✅

> **目标**: 创建 Import 弹窗，实现 GitHub 身份 → GitHub App → Repo 选择的三步流程

**文件：**
- 新建: `components/dialog/import-github-dialog.tsx`
- 修改: `components/search-bar.tsx`（添加弹窗触发）

**Step 1: 创建 Import 弹窗组件框架**

```typescript
// components/dialog/import-github-dialog.tsx
'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

type Step = 'check-github-identity' | 'check-github-app' | 'select-repo'

export function ImportGitHubDialog({ open, onOpenChange }: Props) {
  const [step, setStep] = useState<Step>('check-github-identity')
  // ...
}
```

**Step 2: 实现 Step 1 — 检测 GitHub 身份**

- 调用 Server Action 检查用户是否有 `UserIdentity(provider=GITHUB)`
- 未绑定时显示 "Connect GitHub" 按钮
- 点击按钮跳转 GitHub OAuth

**Step 3: 实现 Step 2 — 检测 GitHub App**

- 调用 `getInstallations()` 检查是否有 installations
- 未安装时显示 "Install GitHub App" 按钮
- 点击按钮用 `window.open()` 打开 GitHub App 安装页面
- 监听弹窗关闭，检测安装状态

**Step 4: 实现 Step 3 — Repo 选择**

- 调用 `getInstallationRepos()` 获取 repo 列表
- 显示可搜索的 repo 列表
- 选择 repo 后创建项目

**Step 5: 集成到 Search Bar**

修改 `components/search-bar.tsx`，点击 Import 按钮时打开弹窗。

**Step 6: 验证并提交**

```bash
pnpm lint
git add components/dialog/import-github-dialog.tsx components/search-bar.tsx
git commit -m "feat(ui): add Import GitHub dialog with 3-step flow"
```

---

### Task 4: Repo 选择器组件 ✅

> **目标**: 创建可复用的 Repo 选择器组件，支持搜索和筛选

**文件：**
- 新建: `components/github/repo-selector.tsx`

**Step 1: 创建 Repo 选择器组件**

```typescript
// components/github/repo-selector.tsx
'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'

interface Repo {
  id: number
  full_name: string
  description: string | null
  private: boolean
  language: string | null
}

interface Props {
  repos: Repo[]
  onSelect: (repo: Repo) => void
}

export function RepoSelector({ repos, onSelect }: Props) {
  const [search, setSearch] = useState('')
  
  const filteredRepos = repos.filter(repo => 
    repo.full_name.toLowerCase().includes(search.toLowerCase())
  )
  
  return (
    // ...
  )
}
```

**Step 2: 添加搜索功能**

- 输入框实时过滤 repo 列表
- 按 repo 名称搜索

**Step 3: 添加 repo 信息展示**

- 显示 repo 名称、描述、语言、私有/公开标识
- 点击选中

**Step 4: 验证并提交**

```bash
pnpm lint
git add components/github/repo-selector.tsx
git commit -m "feat(ui): add Repo selector component with search"
```

---

### Task 5: 集成测试和构建验证 ✅

> **目标**: 确保所有功能正常工作，构建通过

**Step 1: 本地测试**

```bash
pnpm dev
```

手动测试：
1. 设置页面显示 GitHub 状态
2. Import 弹窗三步流程
3. Repo 选择器搜索功能

**Step 2: Lint 检查**

```bash
pnpm lint
```

**Step 3: 构建验证**

```bash
pnpm build
```

**Step 4: 最终提交**

```bash
git add -A
git commit -m "chore: lint fixes for Phase 2"
```

---

### 涉及文件

**前端页面和组件：**
- `app/settings/page.tsx` - 全新设置页面（入口 1）
- `components/dialog/import-github-dialog.tsx` - Import 弹窗（入口 2）
- `components/github/github-status-card.tsx` - GitHub 状态卡片
- `components/github/repo-selector.tsx` - Repo 选择器
- `components/github/installation-list.tsx` - Installation 列表

**Server Actions：**
- `lib/actions/github.ts` - GitHub 相关 Server Actions
  - `getInstallations()` - 获取用户的 installations
  - `getInstallationRepos(installationId)` - 获取 installation 的 repos

**API 路由（仅用于外部调用）：**
- `app/api/github/app/callback/route.ts` - GitHub App 安装回调（Phase 1 已完成）
- `app/api/github/app/webhook/route.ts` - GitHub Webhook（Phase 1 已完成）

---

## Phase 3: 迁移到 Octokit + 合并 OAuth 流程 ✅ 已完成

> **完成日期**: 2026-03-04  
> **修复问题**: Callback 返回格式、前端 deprecated 函数调用、OAuth token exchange 404 错误

### 目标

1. 使用 Octokit 替代手写 fetch，提高可维护性
2. 勾选 "Request user authorization during installation"，合并身份验证和授权流程
3. 废弃独立的 GitHub OAuth 绑定入口

### 架构变化

**之前（Phase 1-2）：**
```
GitHub OAuth (身份) → UserIdentity
GitHub App (授权)   → GitHubAppInstallation
```

**之后（Phase 3+）：**
```
GitHub App Installation (勾选 OAuth during install)
    ↓
同时获取 user access token + installation token
    ↓
自动创建 UserIdentity + GitHubAppInstallation
```

### GitHub App OAuth Flow 详解

当勾选 "Request user authorization during installation" 后，用户安装 GitHub App 的流程：

```
1. 用户点击 "Install GitHub App"
   ↓
2. GitHub 重定向到 OAuth 授权页面
   ↓
3. 用户授权后，GitHub 重定向到 callback URL，参数：
   - installation_id: number
   - setup_action: "install" | "update"
   - code: string (用于换取 user access token)
   ↓
4. 服务端处理：
   a. 用 code 换取 user access token + refresh token
   b. 用 user token 获取 GitHub 用户信息
   c. 创建/更新 UserIdentity (provider=GITHUB)
   d. 创建/更新 GitHubAppInstallation
   e. 存储 tokens（可选）
```

**Token 类型**：
- `access_token` (ghu_*): 8 小时过期
- `refresh_token` (ghr_*): 6 个月过期

### Task 列表

---

### ✅ 已完成工作

**完成日期**: 2026-03-04

#### 1. 安装 Octokit 依赖 ✅

```bash
pnpm add @octokit/rest @octokit/auth-app @octokit/webhooks
```

已安装的依赖：
- `@octokit/rest` - GitHub REST API 客户端
- `@octokit/app` - GitHub App 认证（包含 `@octokit/auth-app`）
- `@octokit/webhooks` - Webhook 签名验证

#### 2. 重构 `lib/services/github-app.ts` ✅

**完成内容**：
- ✅ 使用 `@octokit/app` 的 `App` 类替代手写 JWT 签发
- ✅ Octokit 自动管理 installation token 缓存
- ✅ 新增 `exchangeCodeForUserToken()` 处理 OAuth code exchange
- ✅ 新增 `refreshUserToken()` 处理 token 刷新
- ✅ 保留 `resolvePrivateKey()` 兼容不同格式的私钥配置

**关键修复**：
- 🔧 修复 OAuth token exchange 使用错误的 endpoint（从 Octokit REST API 改为直接调用 `https://github.com/login/oauth/access_token`）
- 🔧 同时修复 `refreshUserToken()` 的相同问题

#### 3. 更新 Callback 路由 ✅

**文件**: `app/api/github/app/callback/route.ts`

**完成内容**：
- ✅ 处理 OAuth code exchange（当 GitHub App 勾选 OAuth 选项时）
- ✅ 创建/更新 `UserIdentity` 记录
- ✅ 创建/更新 `GitHubAppInstallation` 记录
- ✅ 所有权校验逻辑（OAuth 成功后跳过）

**关键修复**：
- 🔧 修复返回格式：从 JSON 改为 HTML 页面
- 🔧 HTML 页面通过 `postMessage` 通知父窗口
- 🔧 弹窗自动关闭，改善用户体验

#### 4. 更新 Webhook 路由 ✅

**文件**: `app/api/github/app/webhook/route.ts`

**完成内容**：
- ✅ 使用 `@octokit/webhooks` 验证签名
- ✅ 处理 installation 生命周期事件

#### 5. 更新前端组件 ✅

**文件**: 
- `components/github/github-status-card.tsx`
- `components/dialog/import-github-dialog.tsx`

**完成内容**：
- ✅ 移除对 deprecated `checkGitHubIdentity()` 的调用
- ✅ 直接使用 `installations.length` 判断连接状态
- ✅ 简化逻辑，符合 Phase 3 设计目标

#### 6. 环境变量配置 ✅

**文件**: `lib/env.ts`

**新增环境变量**：
```bash
GITHUB_APP_CLIENT_ID=Iv23lisup4xxBrxx2gUW
GITHUB_APP_CLIENT_SECRET=555040cab03624017a73eed9272d3f3964ca1632
```

#### 7. GitHub App 设置 ✅

**配置要求**：
- ✅ 勾选 "Request user authorization during installation"
- ✅ 设置 Callback URL: `http://localhost:3000/api/github/app/callback`

---

### 🔧 修复的关键问题

#### 问题 1: Callback 返回 JSON 而不是 HTML
**症状**: 弹窗不自动关闭，父窗口收不到消息  
**原因**: Callback 返回 `NextResponse.json()`  
**修复**: 改为返回 HTML 页面，通过 `postMessage` 通知父窗口

#### 问题 2: OAuth Token Exchange 404 错误
**症状**: `POST /login/oauth/access_token - 404`  
**原因**: 使用 Octokit REST API 路由（不存在）  
**修复**: 直接调用 `https://github.com/login/oauth/access_token`

#### 问题 3: 前端仍使用 deprecated 函数
**症状**: 调用 `checkGitHubIdentity()`  
**原因**: Phase 3 设计中应移除此调用  
**修复**: 直接使用 `installations.length` 判断连接状态

#### 问题 4: GitHub App 没有配置 Callback URL
**症状**: Callback 收不到 `code` 参数  
**原因**: GitHub App 设置中 Callback URL 为空  
**修复**: 在 GitHub App 设置页面配置 Callback URL

---

### 📝 实施细节

**OAuth Token Exchange 实现**：

```typescript
export async function exchangeCodeForUserToken(code: string): Promise<UserTokenResponse> {
  const response = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      client_id: env.GITHUB_APP_CLIENT_ID,
      client_secret: env.GITHUB_APP_CLIENT_SECRET,
      code,
    }),
  })
  
  const data = await response.json()
  // ... 处理响应
}
```

**Callback HTML 页面实现**：

```typescript
function createCallbackPage(success: boolean, message: string): NextResponse {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>GitHub App Installation</title>
    </head>
    <body>
      <script>
        if (window.opener) {
          window.opener.postMessage(
            { type: 'github-app-installed', success: ${success} },
            window.location.origin
          );
        }
        setTimeout(() => window.close(), 1500);
      </script>
    </body>
    </html>
  `
  return new NextResponse(html, { headers: { 'Content-Type': 'text/html' } })
}
```

---

### ✅ 验证结果

- ✅ Lint 检查通过
- ✅ 构建成功
- ✅ GitHub App 安装流程正常工作
- ✅ OAuth code exchange 成功
- ✅ UserIdentity 和 GitHubAppInstallation 正确创建
- ✅ 弹窗自动关闭
- ✅ 前端状态正确更新

---

## Phase 4: 代码迁移 ⏳ 待开始

> **前置条件**: Phase 3 已上线  
> **预计工作量**: 1-2 小时

### 背景

Phase 3 完成了后端基础设施，但前端代码仍在使用旧的 `githubRepo` 字段。需要更新前端代码使用新字段，同时保持向后兼容。

### 为什么不是"数据迁移"？

**原计划（数据迁移）**：
- ❌ 旧数据无法自动迁移（`githubRepo` 只是字符串，缺少 `installationId` 和 `repoId`）
- ✅ 用户重新关联 repo 时会自动填充新字段

**新计划（代码迁移）**：
- ✅ 更新前端代码优先使用新字段
- ✅ 保留旧字段作为 fallback（向后兼容）
- ✅ 确保新旧数据都能正常工作

### 迁移策略

**优先级顺序**：
```typescript
// 优先使用新字段，fallback 到旧字段
const repoFullName = project.githubRepoFullName || project.githubRepo
const repoId = project.githubRepoId
const installationId = project.githubAppInstallationId
```

### 需要更新的文件

#### 1. 前端组件

**`components/layout/repo-status-indicator.tsx`**
- 当前：使用 `project.githubRepo`
- 更新：优先使用 `project.githubRepoFullName`，fallback 到 `project.githubRepo`
- 显示：repo 链接、状态指示器

**`app/(dashboard)/projects/[id]/github/page.tsx`**
- 当前：使用 `project.githubRepo`
- 更新：优先使用新字段，显示更丰富的信息
- 新增：显示 installation 信息（如果有的话）

#### 2. 服务层

**`lib/services/repoService.ts`**
- 当前：使用 `project.githubRepo` 进行 Git 操作
- 更新：
  - 优先使用 `githubRepoFullName` 获取 repo 名称
  - 使用 `githubAppInstallationId` 获取 installation token
  - 使用 `githubRepoId` 进行 API 操作

#### 3. 类型定义

**确保 TypeScript 类型正确**：
```typescript
interface Project {
  // ... existing fields
  githubRepo?: string | null // @deprecated
  githubAppInstallationId?: string | null
  githubRepoId?: number | null
  githubRepoFullName?: string | null
  githubAppInstallation?: GitHubAppInstallation | null
}
```

### 实施步骤

#### Task 1: 更新 repo-status-indicator 组件

**文件**: `components/layout/repo-status-indicator.tsx`

**变更**：
```typescript
// Before
{project.githubRepo ? (
  <a href={project.githubRepo}>...</a>
) : ...}

// After
{(project.githubRepoFullName || project.githubRepo) ? (
  <a href={`https://github.com/${project.githubRepoFullName || project.githubRepo}`}>
    {project.githubRepoFullName || project.githubRepo}
  </a>
) : ...}
```

#### Task 2: 更新 GitHub 页面

**文件**: `app/(dashboard)/projects/[id]/github/page.tsx`

**变更**：
- 使用新字段显示 repo 信息
- 如果有 `githubAppInstallation`，显示 installation 详情
- 保留旧字段的 fallback 逻辑

#### Task 3: 更新 repoService

**文件**: `lib/services/repoService.ts`

**变更**：
- 使用 `githubRepoFullName` 或 `githubRepo` 获取 repo 名称
- 使用 `githubAppInstallationId` 获取 installation（如果有）
- 实现优先级逻辑

#### Task 4: 测试验证

**测试场景**：
1. ✅ 旧数据（只有 `githubRepo`）- 应该正常显示
2. ✅ 新数据（有新字段）- 应该优先使用新字段
3. ✅ 混合数据（同时有新旧字段）- 应该优先使用新字段
4. ✅ 没有数据 - 应该显示"未连接"状态

### 向后兼容性

**保证**：
- ✅ 旧数据仍然可以正常工作
- ✅ 新数据会使用更准确的信息
- ✅ 用户重新关联 repo 时会自动填充新字段
- ✅ 不需要强制迁移旧数据

---

## Phase 5: 清理 ⏳ 待开始（可选）

> **前置条件**: Phase 4 上线后至少 3-6 个月，确认旧数据不再需要  
> **优先级**: 低（可以延后或跳过）

### 清理内容

**数据库清理**：
1. 移除 `Project.githubRepo` 字段（schema 变更）
2. 运行数据库迁移

**代码清理**：
3. 移除所有对 `githubRepo` 的引用
4. 移除废弃的 GitHub OAuth 路由：
   - `app/api/user/github/bind/route.ts`
   - `app/api/auth/github/callback/route.ts`
   - `app/api/user/github/route.ts`
5. 移除 `lib/actions/github.ts` 中的 `checkGitHubIdentity()`

**文档更新**：
6. 更新 API 文档
7. 更新用户文档

### 为什么可以延后？

**向后兼容性好**：
- ✅ 新旧字段可以共存
- ✅ Fallback 逻辑确保旧数据可用
- ✅ 不影响用户体验

**风险低**：
- ✅ 旧字段只是 deprecated，不是 bug
- ✅ 保留旧字段不影响性能
- ✅ 可以在未来版本中清理

**建议时机**：
- Phase 4 上线后 3-6 个月
- 或者当大部分用户已经使用新流程时
- 或者直接跳过，保持向后兼容
