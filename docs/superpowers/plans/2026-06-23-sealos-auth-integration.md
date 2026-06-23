# Sealos Auth Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move the existing Sealos auth/session integration out of top-level `provider/` code and into `lib/platform/integrations/sealos/auth/`, while keeping the current UI behavior unchanged.

**Architecture:** `lib/platform/integrations/sealos/auth/` owns Sealos-specific auth/session behavior: iframe detection, SDK app initialization, session normalization, and exported types. `provider/sealos.tsx` remains only as a thin React client wrapper that stores auth/session state in context for UI consumers.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript strict mode, Vitest, `@zjy365/sealos-desktop-sdk`.

---

## Scope

Build only the Sealos auth integration slice. Do not implement Sealos devbox, k8s, aiproxy, namespace, or runtime adapter features in this plan.

Keep all existing consumers working:

- `app/(landing)/_components/landing-client.tsx`
- `components/home-page.tsx`
- `components/dialog/settings-dialog.tsx`
- `provider/providers.tsx`

Keep the existing public React API:

- `SealosProvider`
- `useSealos`
- `waitForSealosInit`

## File Structure

- Create `lib/platform/integrations/sealos/auth/types.ts`
  - Owns Sealos auth/session TypeScript types shared by integration functions and React wrapper.

- Create `lib/platform/integrations/sealos/auth/detect-sealos-iframe.ts`
  - Pure browser-environment detection for Sealos iframe hosts.
  - One business action: detect whether the current browser window is embedded by Sealos.

- Create `lib/platform/integrations/sealos/auth/detect-sealos-iframe.test.ts`
  - Vitest coverage for browser/server/error fallback detection behavior.

- Create `lib/platform/integrations/sealos/auth/get-sealos-session.ts`
  - Initializes the Sealos Desktop SDK and normalizes `sealosApp.getSession()` into local auth/session types.
  - One business action: load a Sealos auth session from the Sealos Desktop SDK.

- Create `lib/platform/integrations/sealos/auth/get-sealos-session.test.ts`
  - Vitest coverage for SDK initialization, session normalization, and error propagation.

- Create `lib/platform/integrations/sealos/auth/index.ts`
  - Barrel export for Sealos auth integration functions and types.

- Modify `provider/sealos.tsx`
  - Remove direct SDK import and inline iframe detection.
  - Import auth integration functions/types from `@/lib/platform/integrations/sealos/auth`.
  - Keep the existing context shape and runtime behavior.

- Modify `provider/providers.tsx`
  - No behavior change expected. Only update import paths if the implementation chooses to move `provider/sealos.tsx`. This plan keeps it in place, so no edit should be needed.

## Task 1: Add Sealos Auth Types

**Files:**
- Create: `lib/platform/integrations/sealos/auth/types.ts`

- [ ] **Step 1: Create the type file**

Add this complete file:

```ts
export interface SealosUserInfo {
  id: string
  name: string
  avatar: string
  k8sUsername: string
  nsid: string
}

export interface SealosAuthSession {
  token: string
  kubeconfig: string
  user: SealosUserInfo
  namespaceId: string
  cleanup: () => void
}
```

- [ ] **Step 2: Run TypeScript lint on the new file's import surface**

Run:

```bash
pnpm lint lib/platform/integrations/sealos/auth/types.ts
```

Expected: PASS with no lint errors for `types.ts`.

- [ ] **Step 3: Commit**

Run:

```bash
git add lib/platform/integrations/sealos/auth/types.ts
git commit -m "refactor: add sealos auth integration types"
```

Expected: commit succeeds.

## Task 2: Extract Sealos Iframe Detection

**Files:**
- Create: `lib/platform/integrations/sealos/auth/detect-sealos-iframe.ts`
- Create: `lib/platform/integrations/sealos/auth/detect-sealos-iframe.test.ts`

- [ ] **Step 1: Write the failing test**

Create `lib/platform/integrations/sealos/auth/detect-sealos-iframe.test.ts` with:

```ts
import { afterEach, describe, expect, it, vi } from 'vitest'

import { detectSealosIframe } from '@/lib/platform/integrations/sealos/auth/detect-sealos-iframe'

describe('detectSealosIframe', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('returns false when no window is provided', () => {
    expect(detectSealosIframe(undefined)).toBe(false)
  })

  it('returns false when the window has no ancestor origin', () => {
    expect(detectSealosIframe({ location: {} })).toBe(false)
  })

  it('returns true for sealos.io ancestor origins', () => {
    expect(
      detectSealosIframe({
        location: {
          ancestorOrigins: ['https://cloud.sealos.io'],
        },
      }),
    ).toBe(true)
  })

  it('returns true for sealos.run ancestor origins', () => {
    expect(
      detectSealosIframe({
        location: {
          ancestorOrigins: ['https://workspace.sealos.run'],
        },
      }),
    ).toBe(true)
  })

  it('returns false for non-Sealos ancestor origins', () => {
    expect(
      detectSealosIframe({
        location: {
          ancestorOrigins: ['https://example.com'],
        },
      }),
    ).toBe(false)
  })

  it('returns false when ancestor origin access throws', () => {
    const browserWindow = {
      location: {
        get ancestorOrigins() {
          throw new Error('blocked')
        },
      },
    }

    expect(detectSealosIframe(browserWindow)).toBe(false)
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```bash
pnpm test lib/platform/integrations/sealos/auth/detect-sealos-iframe.test.ts
```

Expected: FAIL because `detect-sealos-iframe.ts` does not exist.

- [ ] **Step 3: Implement iframe detection**

Create `lib/platform/integrations/sealos/auth/detect-sealos-iframe.ts` with:

```ts
type BrowserWindowLike = {
  location?: {
    ancestorOrigins?: ArrayLike<string>
  }
}

/**
 * Detects whether the current browser frame is embedded by Sealos.
 *
 * Expected inputs:
 * - A browser `window` object, or no value in server/test environments.
 *
 * Expected outputs:
 * - Returns true when the first ancestor origin is a known Sealos host.
 *
 * Out of scope:
 * - Does not initialize the Sealos SDK.
 * - Does not authenticate the Fulling user.
 */
export function detectSealosIframe(browserWindow?: BrowserWindowLike): boolean {
  if (!browserWindow) return false

  try {
    const ancestorOrigin = browserWindow.location?.ancestorOrigins?.[0]
    if (!ancestorOrigin) return false

    return ancestorOrigin.includes('sealos.io') || ancestorOrigin.includes('sealos.run')
  } catch {
    return false
  }
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run:

```bash
pnpm test lib/platform/integrations/sealos/auth/detect-sealos-iframe.test.ts
```

Expected: PASS for all `detectSealosIframe` tests.

- [ ] **Step 5: Commit**

Run:

```bash
git add lib/platform/integrations/sealos/auth/detect-sealos-iframe.ts lib/platform/integrations/sealos/auth/detect-sealos-iframe.test.ts
git commit -m "refactor: extract sealos iframe detection"
```

Expected: commit succeeds.

## Task 3: Extract Sealos Session Loading

**Files:**
- Create: `lib/platform/integrations/sealos/auth/get-sealos-session.ts`
- Create: `lib/platform/integrations/sealos/auth/get-sealos-session.test.ts`

- [ ] **Step 1: Write the failing test**

Create `lib/platform/integrations/sealos/auth/get-sealos-session.test.ts` with:

```ts
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { createSealosApp, sealosApp } = vi.hoisted(() => ({
  createSealosApp: vi.fn(),
  sealosApp: {
    getSession: vi.fn(),
  },
}))

vi.mock('@zjy365/sealos-desktop-sdk/app', () => ({
  createSealosApp,
  sealosApp,
}))

import { getSealosSession } from '@/lib/platform/integrations/sealos/auth/get-sealos-session'

describe('getSealosSession', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('initializes the SDK and returns a normalized Sealos auth session', async () => {
    const cleanup = vi.fn()
    createSealosApp.mockReturnValue(cleanup)
    sealosApp.getSession.mockResolvedValue({
      token: 'sealos-token',
      kubeconfig: 'apiVersion: v1',
      user: {
        id: 'user-id',
        name: 'sealos-user',
        avatar: 'https://example.com/avatar.png',
        k8sUsername: 'k8s-user',
        nsid: 'ns-user',
      },
    })

    const result = await getSealosSession()

    expect(result).toEqual({
      token: 'sealos-token',
      kubeconfig: 'apiVersion: v1',
      namespaceId: 'ns-user',
      user: {
        id: 'user-id',
        name: 'sealos-user',
        avatar: 'https://example.com/avatar.png',
        k8sUsername: 'k8s-user',
        nsid: 'ns-user',
      },
      cleanup,
    })
    expect(createSealosApp).toHaveBeenCalledTimes(1)
    expect(sealosApp.getSession).toHaveBeenCalledTimes(1)
  })

  it('uses a no-op cleanup when the SDK initializer returns nothing', async () => {
    createSealosApp.mockReturnValue(undefined)
    sealosApp.getSession.mockResolvedValue({
      token: 'sealos-token',
      kubeconfig: 'apiVersion: v1',
      user: {
        id: 'user-id',
        name: 'sealos-user',
        avatar: '',
        k8sUsername: 'k8s-user',
        nsid: 'ns-user',
      },
    })

    const result = await getSealosSession()

    expect(() => result.cleanup()).not.toThrow()
  })

  it('rethrows session loading errors from the SDK', async () => {
    const error = new Error('session unavailable')
    createSealosApp.mockReturnValue(vi.fn())
    sealosApp.getSession.mockRejectedValue(error)

    await expect(getSealosSession()).rejects.toThrow(error)
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```bash
pnpm test lib/platform/integrations/sealos/auth/get-sealos-session.test.ts
```

Expected: FAIL because `get-sealos-session.ts` does not exist.

- [ ] **Step 3: Implement session loading**

Create `lib/platform/integrations/sealos/auth/get-sealos-session.ts` with:

```ts
import { createSealosApp, sealosApp } from '@zjy365/sealos-desktop-sdk/app'

import type { SealosAuthSession } from './types'

/**
 * Loads the current Sealos Desktop auth session.
 *
 * Expected inputs:
 * - Must run in a Sealos Desktop iframe after the caller has detected Sealos.
 *
 * Expected outputs:
 * - Returns normalized token, kubeconfig, user, namespace, and cleanup values.
 *
 * Out of scope:
 * - Does not decide whether the current browser is in Sealos.
 * - Does not authenticate the Fulling NextAuth session.
 */
export async function getSealosSession(): Promise<SealosAuthSession> {
  const cleanupApp = createSealosApp()
  const sealosSession = await sealosApp.getSession()

  return {
    token: sealosSession.token as unknown as string,
    kubeconfig: sealosSession.kubeconfig,
    user: sealosSession.user,
    namespaceId: sealosSession.user.nsid,
    cleanup: cleanupApp ?? (() => {}),
  }
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run:

```bash
pnpm test lib/platform/integrations/sealos/auth/get-sealos-session.test.ts
```

Expected: PASS for all `getSealosSession` tests.

- [ ] **Step 5: Commit**

Run:

```bash
git add lib/platform/integrations/sealos/auth/get-sealos-session.ts lib/platform/integrations/sealos/auth/get-sealos-session.test.ts
git commit -m "refactor: extract sealos session loading"
```

Expected: commit succeeds.

## Task 4: Add Sealos Auth Barrel Export

**Files:**
- Create: `lib/platform/integrations/sealos/auth/index.ts`

- [ ] **Step 1: Create the barrel export**

Create `lib/platform/integrations/sealos/auth/index.ts` with:

```ts
export { detectSealosIframe } from './detect-sealos-iframe'
export { getSealosSession } from './get-sealos-session'
export type { SealosAuthSession, SealosUserInfo } from './types'
```

- [ ] **Step 2: Run auth integration tests**

Run:

```bash
pnpm test lib/platform/integrations/sealos/auth/detect-sealos-iframe.test.ts lib/platform/integrations/sealos/auth/get-sealos-session.test.ts
```

Expected: PASS for both test files.

- [ ] **Step 3: Commit**

Run:

```bash
git add lib/platform/integrations/sealos/auth/index.ts
git commit -m "refactor: export sealos auth integration"
```

Expected: commit succeeds.

## Task 5: Make the React Provider Use the Auth Integration

**Files:**
- Modify: `provider/sealos.tsx`

- [ ] **Step 1: Update imports and remove local Sealos types/detection**

In `provider/sealos.tsx`, replace:

```ts
import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { createSealosApp, sealosApp } from '@zjy365/sealos-desktop-sdk/app';

interface SealosUserInfo {
  id: string;
  name: string;
  avatar: string;
  k8sUsername: string;
  nsid: string;
}

let sealosInitPromise: Promise<void> | null = null;

/**
 * Detect if running inside Sealos iframe environment
 * Uses ancestorOrigins to check parent frame domain
 */
function isSealosIframe(): boolean {
  if (typeof window === 'undefined') return false;

  try {
    const ancestorOrigin = window.location.ancestorOrigins?.[0];
    if (!ancestorOrigin) return false;

    // Check if ancestor domain contains Sealos domains
    return ancestorOrigin.includes('sealos.io') || ancestorOrigin.includes('sealos.run');
  } catch {
    return false;
  }
}
```

with:

```ts
import React, { createContext, useContext, useEffect, useRef, useState } from 'react';

import {
  detectSealosIframe,
  getSealosSession,
  type SealosUserInfo,
} from '@/lib/platform/integrations/sealos/auth';

let sealosInitPromise: Promise<void> | null = null;
```

- [ ] **Step 2: Replace inline iframe detection and SDK session loading**

In `provider/sealos.tsx`, replace this block inside `initializeSealos`:

```ts
        // First, check if we're in Sealos iframe environment
        const isInSealosIframe = isSealosIframe();
```

with:

```ts
        const isInSealosIframe = detectSealosIframe(window);
```

Then replace this block:

```ts
        // In Sealos iframe, initialize SDK and get credentials
        console.info('Detected Sealos iframe environment, initializing SDK...');
        const cleanupApp = createSealosApp();

        // get session info
        console.info('Getting Sealos session...');
        const sealosSession = await sealosApp.getSession();
        const sealosToken = sealosSession.token as unknown as string;
        const sealosNs = sealosSession.user.nsid;
```

with:

```ts
        console.info('Detected Sealos iframe environment, initializing SDK...');
        console.info('Getting Sealos session...');
        const sealosSession = await getSealosSession();
```

Then replace the successful `setState` call:

```ts
        setState({
          isInitialized: true,
          isLoading: false,
          isSealos: true,
          error: null,
          sealosToken,
          sealosKubeconfig: sealosSession.kubeconfig,
          sealosUser: sealosSession.user,
          sealosNs,
        });
```

with:

```ts
        setState({
          isInitialized: true,
          isLoading: false,
          isSealos: true,
          error: null,
          sealosToken: sealosSession.token,
          sealosKubeconfig: sealosSession.kubeconfig,
          sealosUser: sealosSession.user,
          sealosNs: sealosSession.namespaceId,
        });
```

Then replace cleanup assignment:

```ts
        // cleanup
        cleanupRef.current = () => {
          cleanupApp?.();
        };
```

with:

```ts
        cleanupRef.current = sealosSession.cleanup;
```

- [ ] **Step 3: Run targeted auth integration tests**

Run:

```bash
pnpm test lib/platform/integrations/sealos/auth/detect-sealos-iframe.test.ts lib/platform/integrations/sealos/auth/get-sealos-session.test.ts
```

Expected: PASS for both test files.

- [ ] **Step 4: Run lint on touched files**

Run:

```bash
pnpm lint provider/sealos.tsx lib/platform/integrations/sealos/auth
```

Expected: PASS with no lint errors.

- [ ] **Step 5: Commit**

Run:

```bash
git add provider/sealos.tsx
git commit -m "refactor: use sealos auth integration in provider"
```

Expected: commit succeeds.

## Task 6: Verify No Old Sealos SDK Usage Remains in React Provider Layer

**Files:**
- Verify only: `provider/sealos.tsx`
- Verify only: `lib/platform/integrations/sealos/auth/*`

- [ ] **Step 1: Search for direct SDK imports**

Run:

```bash
rg -n "createSealosApp|sealosApp|getSession\\(" provider lib/platform/integrations/sealos
```

Expected output includes SDK usage only in:

```txt
lib/platform/integrations/sealos/auth/get-sealos-session.ts
```

Expected output may include test mocks in:

```txt
lib/platform/integrations/sealos/auth/get-sealos-session.test.ts
```

Expected output must not include `provider/sealos.tsx`.

- [ ] **Step 2: Search for old import paths used by app consumers**

Run:

```bash
rg -n "@/provider/sealos|from './sealos'|from '@/lib/platform/integrations/sealos/auth'" app components provider lib/platform
```

Expected:

- Existing UI consumers may still import `useSealos` from `@/provider/sealos`.
- `provider/providers.tsx` may still import `SealosProvider` from `./sealos`.
- `provider/sealos.tsx` imports from `@/lib/platform/integrations/sealos/auth`.

- [ ] **Step 3: Run the full test suite**

Run:

```bash
pnpm test
```

Expected: PASS for the repository's Vitest suite.

- [ ] **Step 4: Run full lint**

Run:

```bash
pnpm lint
```

Expected: PASS with no lint errors.

- [ ] **Step 5: Commit if verification required cleanup**

If Step 1 or Step 2 revealed unexpected references and the implementation fixed them, run:

```bash
git add provider/sealos.tsx lib/platform/integrations/sealos/auth
git commit -m "chore: clean up sealos auth references"
```

Expected: commit succeeds only if cleanup edits were made. If no cleanup edits were made, skip this commit.

## Manual Acceptance Checks

- Non-Sealos browser:
  - `detectSealosIframe(window)` returns false when no Sealos ancestor origin is present.
  - Landing and home pages do not auto-authenticate.
  - Login navigation behavior remains unchanged.

- Sealos iframe:
  - `detectSealosIframe(window)` returns true for `sealos.io` or `sealos.run` ancestor origin.
  - `getSealosSession()` initializes the Sealos Desktop SDK and returns `token`, `kubeconfig`, `user`, and `namespaceId`.
  - Existing landing/home auto-auth behavior still passes `sealosToken` and `sealosKubeconfig` to `authenticateWithSealos`.

## Rollback

This change is code-only and does not alter database schema, persisted data, environment variables, or external state. Roll back by reverting the commits from Tasks 1-5. If only Task 5 causes a runtime issue, revert Task 5 first; the unused integration files can remain temporarily without changing application behavior.

## Self-Review

- Spec coverage:
  - Auth-only scope is covered by `lib/platform/integrations/sealos/auth/`.
  - Existing React API is preserved by keeping `provider/sealos.tsx`.
  - Devbox/k8s/aiproxy/namespace/runtime features are explicitly out of scope.

- Placeholder scan:
  - The plan contains no unresolved implementation markers.
  - All code steps include exact code blocks.

- Type consistency:
  - `SealosUserInfo`, `SealosAuthSession`, `detectSealosIframe`, and `getSealosSession` names are consistent across tests, implementation, barrel export, and provider usage.
