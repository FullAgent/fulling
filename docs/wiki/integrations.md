# Integrations

## Overview

The repository integrates with external systems through a mix of `lib/k8s/`, `lib/services/`, `lib/util/`, and the newer `lib/platform/integrations/` layer.

The main integrations are:

- Kubernetes
- Sealos
- GitHub App and GitHub OAuth
- ttyd
- Anthropic-compatible proxy settings

## Kubernetes

Kubernetes is the primary infrastructure backend for both sandbox and database resources.

Core integration points:

- `lib/k8s/k8s-service-helper.ts` - user-scoped service resolution from `KUBECONFIG`
- `lib/k8s/kubernetes-service-factory.ts` - service instance caching
- `lib/k8s/kubernetes.ts` - main service implementation
- `lib/platform/integrations/k8s/get-user-default-namespace.ts` - control-plane namespace lookup

Kubernetes effects are intentionally kept out of the initial user mutation path. The control plane writes intent first, then reconcile jobs call the Kubernetes service later.

## Sealos

Sealos appears in two roles:

1. embedded runtime detection through `provider/sealos.tsx`
2. auth bootstrap through the Sealos credentials provider in `lib/auth.ts`

When the app detects a Sealos iframe, it can pull session data, kubeconfig, and namespace-like identity details from the Sealos desktop SDK.

## GitHub App and GitHub OAuth

GitHub integration covers three related needs:

- user sign-in and token storage
- GitHub App installation tracking
- repository discovery and import

Core modules:

- `lib/services/github-app.ts`
- `app/api/github/app/callback/route.ts`
- `app/api/github/app/webhook/route.ts`
- `lib/actions/github.ts`
- `lib/platform/integrations/github/find-installation-repository.ts`

The webhook currently updates installation lifecycle status. Repository import uses installation tokens rather than user PAT-like flows.

## ttyd

ttyd is the transport layer for sandbox command execution.

Important modules:

- `lib/util/ttyd-context.ts`
- `lib/util/ttyd-exec.ts`
- `app/api/sandbox/[id]/exec/route.ts`
- `app/api/sandbox/[id]/cwd/route.ts`
- `lib/jobs/project-task/executors/*`

This is how the app:

- runs background commands in the sandbox
- resolves current working directories
- clones GitHub repositories into the sandbox
- installs and uninstalls skills inside project workspaces

## Anthropic Proxy Support

User-level Anthropic settings are stored in `UserConfig`. `lib/services/aiproxy.ts` then:

- creates proxy tokens when Sealos auth is used
- projects Anthropic env vars into sandboxes during create and update flows

This lets sandboxes inherit AI configuration without storing those values directly in project env rows.

## Emerging `lib/platform/integrations/` Layer

Readmes under `lib/platform/integrations/` describe a cleaner boundary for provider-specific protocol logic.

Currently visible integration slices:

- `github/`
- `k8s/`
- `aiproxy/`
- `ttyd/`

The repository still mixes old and new approaches, so these directories should be read as directionally important rather than fully exhaustive of all provider-facing code.

## Constraints

- GitHub organization installations are explicitly rejected in the callback flow today.
- ttyd-backed command execution is powerful and central to task execution, so sandbox availability is a hard prerequisite for import and skill rollout.
- Kubernetes access is entirely user-scoped. Without `KUBECONFIG`, project and database creation fail early.

