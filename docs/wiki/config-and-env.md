# Config and Env

## Configuration Files

### `next.config.ts`

The Next.js runtime is configured with:

- `reactStrictMode: true`
- `output: 'standalone'`
- image allowlist for `avatars.githubusercontent.com`
- `serverExternalPackages: ['pino']`

### `instrumentation.ts`

The instrumentation hook initializes the application on server startup and calls `initializeApp()` from `lib/startup/index.ts`.

That startup path registers listeners and starts background jobs once per process.

### `package.json`

Runtime assumptions:

- Next.js 16
- React 19
- Node `>=22.12.0`
- pnpm `10.20.0`

## Environment Variables

### Platform-Level Variables

Validated in `lib/env.ts`:

- `DATABASE_URL`
- `RUNTIME_IMAGE`
- `ENABLE_PASSWORD_AUTH`
- `ENABLE_GITHUB_AUTH`
- `ENABLE_SEALOS_AUTH`
- `GITHUB_CLIENT_ID`
- `GITHUB_CLIENT_SECRET`
- `GITHUB_APP_ID`
- `GITHUB_APP_PRIVATE_KEY`
- `GITHUB_APP_WEBHOOK_SECRET`
- `GITHUB_APP_CLIENT_ID`
- `GITHUB_APP_CLIENT_SECRET`
- `ANTHROPIC_BASE_URL`
- `AIPROXY_ENDPOINT`
- `ANTHROPIC_MODEL`
- `ANTHROPIC_SMALL_FAST_MODEL`

Client-exposed variables:

- `NEXT_PUBLIC_GITHUB_APP_ID`
- `NEXT_PUBLIC_GITHUB_APP_NAME`

### User-Scoped Runtime Config

Stored in `UserConfig` and managed through settings APIs:

- `KUBECONFIG`
- `ANTHROPIC_API_KEY`
- `ANTHROPIC_API`
- `ANTHROPIC_MODEL`
- `ANTHROPIC_SMALL_FAST_MODEL`
- `SYSTEM_PROMPT`

Kubeconfig writes also clear the cached Kubernetes service instance for that user.

### Project-Scoped Runtime Config

Stored in the `Environment` table and managed per project.

Known categories from `EnvironmentCategory`:

- `auth`
- `payment`
- `ttyd`
- `file_browser`
- `general`
- `secret`

Project configuration pages currently surface `auth`, `payment`, `general`, and `secret`.

## Build-Time and Runtime Assumptions

- The dev server and production server run on `0.0.0.0:3000`.
- Secure cookie behavior changes with `NODE_ENV`.
- Startup expects a Node.js runtime and does not initialize jobs in non-node runtimes.
- Reconcile behavior is interval-based and controlled by environment variables for lock duration and batch size.

## Runtime Integrations

Environment configuration directly influences:

- auth provider availability
- GitHub App identity and webhook handling
- Kubernetes namespace and service access
- sandbox runtime image and projected env vars
- Anthropic-compatible proxy configuration inside sandboxes

## Constraints

- The repository includes `.env.template` and `yaml/.env.template`, but `lib/env.ts` remains the authoritative schema for validated platform env requirements.
- User config and project env are separate concerns. Global settings such as kubeconfig and Anthropic credentials do not live in project env rows.
