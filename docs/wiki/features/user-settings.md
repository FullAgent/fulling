# User Settings

## Purpose

This domain manages user-scoped configuration that affects all projects or the platform shell itself.

## User-Facing Surfaces

- `/settings` - redirects to integrations
- `/settings/integrations` - current settings page
- settings dialog opened from sidebars or project GitHub surfaces

## Main Flows

- Save a system prompt for AI-assisted development context.
- Validate and store kubeconfig for user-scoped Kubernetes access.
- Save Anthropic-compatible proxy configuration.
- Install or inspect the connected GitHub App account.

## Supporting APIs

- `GET | POST /api/user/config`
- `GET | POST /api/user/config/anthropic`
- `GET | POST /api/user/config/kc`
- `GET | POST /api/user/config/system-prompt`

## Key Modules

- `components/dialog/settings-dialog.tsx` - primary settings UI
- `app/(dashboard)/settings/integrations/page.tsx` - settings landing page
- `app/(dashboard)/settings/_components/github-status-card.tsx` - GitHub integration summary
- `provider/sealos.tsx` - Sealos environment detection
- `lib/k8s/k8s-service-helper.ts` - kubeconfig persistence and cache invalidation

## Constraints

- Only `/settings/integrations` is implemented; `/settings/account` is linked but missing.
- Kubeconfig is user-scoped, not project-scoped.
- In a Sealos environment the app can detect iframe context and treat kubeconfig differently from a normal browser session.

