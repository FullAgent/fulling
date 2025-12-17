# ttyd Authentication Architecture

## Overview

FullstackAgent uses **ttyd's HTTP Basic Auth** (`-c` parameter) combined with the `?authorization=` URL parameter for seamless, popup-free terminal authentication.

## Table of Contents

1. [Authentication Flow](#authentication-flow)
2. [URL Format](#url-format)
3. [Authentication Layers](#authentication-layers)
4. [Security Features](#security-features)
5. [Implementation Details](#implementation-details)
6. [Session Tracking](#session-tracking)
7. [Troubleshooting](#troubleshooting)

---

## Authentication Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          1. Project Creation                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│  app/api/projects/route.ts                                                  │
│  ┌────────────────────────────────────────────────────────────────────────┐│
│  │ const ttydAuthToken = generateRandomString(24) // 143 bits entropy     ││
│  │ await tx.environment.create({                                          ││
│  │   key: 'TTYD_ACCESS_TOKEN',                                            ││
│  │   value: ttydAuthToken,                                                ││
│  │   category: EnvironmentCategory.TTYD,                                  ││
│  │   isSecret: true                                                       ││
│  │ })                                                                     ││
│  └────────────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          2. Sandbox Creation                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│  lib/k8s/sandbox-manager.ts                                                 │
│  ┌────────────────────────────────────────────────────────────────────────┐│
│  │ // Build ttydUrl with HTTP Basic Auth (authorization URL parameter)    ││
│  │ const credentials = `user:${ttydAccessToken}`                          ││
│  │ const authBase64 = Buffer.from(credentials).toString('base64')         ││
│  │ const ttydUrl = `${baseTtydUrl}?authorization=${authBase64}`           ││
│  │                                                                        ││
│  │ // Environment variable injected into K8s pod                          ││
│  │ envVars: { TTYD_ACCESS_TOKEN: "xxx..." }                               ││
│  └────────────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          3. Container Runtime                                │
├─────────────────────────────────────────────────────────────────────────────┤
│  sandbox/entrypoint.sh                                                      │
│  ┌────────────────────────────────────────────────────────────────────────┐│
│  │ TTYD_CREDENTIAL="user:${TTYD_ACCESS_TOKEN}"                            ││
│  │                                                                        ││
│  │ ttyd -T xterm-256color \                                               ││
│  │      -W \                           # WebSocket compression             ││
│  │      -a \                           # Allow URL args (?arg=SESSION_ID)  ││
│  │      -c "$TTYD_CREDENTIAL" \        # HTTP Basic Auth                   ││
│  │      -t "$THEME" \                                                     ││
│  │      /usr/local/bin/ttyd-startup.sh                                       ││
│  └────────────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          4. Frontend Connection                              │
├─────────────────────────────────────────────────────────────────────────────┤
│  components/terminal/xterm-terminal.tsx                                     │
│  ┌────────────────────────────────────────────────────────────────────────┐│
│  │ const parseUrl = () => {                                               ││
│  │   const authorization = url.searchParams.get('authorization')          ││
│  │   url.searchParams.append('arg', terminalSessionId.current)            ││
│  │   // URL: ?authorization=base64(user:pass)&arg=SESSION_ID              ││
│  │   return { wsFullUrl, authorization }                                  ││
│  │ }                                                                      ││
│  │                                                                        ││
│  │ socket.onopen = () => {                                                ││
│  │   // Send AuthToken in JSON (required by ttyd -c)                      ││
│  │   const initMsg = JSON.stringify({                                     ││
│  │     AuthToken: authorization,  // base64(user:password)                ││
│  │     columns: terminal.cols,                                            ││
│  │     rows: terminal.rows,                                               ││
│  │   })                                                                   ││
│  │   socket.send(textEncoder.encode(initMsg))                             ││
│  │ }                                                                      ││
│  └────────────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          5. Session Handler Script                           │
├─────────────────────────────────────────────────────────────────────────────┤
│  sandbox/ttyd-startup.sh                                                       │
│  ┌────────────────────────────────────────────────────────────────────────┐│
│  │ # NOTE: Authentication is handled by ttyd -c at HTTP layer             ││
│  │ # This script only handles session tracking for file upload cwd        ││
│  │                                                                        ││
│  │ # Arguments (via ?arg=...):                                            ││
│  │ #   $1 - TERMINAL_SESSION_ID                                           ││
│  │                                                                        ││
│  │ if [ "$#" -ge 1 ] && [ -n "$1" ]; then                                 ││
│  │     TERMINAL_SESSION_ID="$1"                                           ││
│  │     echo "$$" > "/tmp/.terminal-session-${TERMINAL_SESSION_ID}"        ││
│  │ fi                                                                     ││
│  │                                                                        ││
│  │ exec /bin/bash                                                         ││
│  └────────────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## URL Format

```
https://{sandbox}-ttyd.{domain}?authorization={base64}&arg={session_id}
                                ^^^^^^^^^^^^^^^^^^^^^^^^ ^^^^^^^^^^^^^^^
                                HTTP Basic Auth          Session tracking
```

**Example:**
```
https://myproject-ttyd.usw.sealos.io?authorization=dXNlcjphYmMxMjM=&arg=terminal-1234567890-abc123
```

Where `dXNlcjphYmMxMjM=` is `base64("user:abc123")`.

---

## Authentication Layers

| Layer | Mechanism | Purpose |
|-------|-----------|---------|
| **HTTP** | `?authorization=base64(user:pass)` | Validates at HTTP handshake, no browser popup |
| **WebSocket** | `AuthToken` in JSON message | Required by ttyd when `-c` is used |
| **Shell** | ttyd-startup.sh | Session tracking only (no auth check) |

### How It Works

1. **HTTP Layer**: ttyd validates `?authorization=` parameter against `-c` credential
2. **WebSocket Layer**: First JSON message must include `AuthToken` field
3. **Shell Layer**: ttyd-startup.sh receives `?arg=` parameters for session tracking

---

## Security Features

### Token Generation

| Property | Value |
|----------|-------|
| Length | 24 characters |
| Character set | `A-Za-z0-9` (62 characters) |
| Entropy | ~143 bits (62^24 combinations) |
| Generator | nanoid with `crypto.getRandomValues()` |

```typescript
// app/api/projects/route.ts
const ttydAuthToken = generateRandomString(24) // 143 bits entropy
```

### Token Storage

- Stored in `Environment` table
- Category: `ttyd`
- `isSecret: true`
- Injected into K8s pod as environment variable

### Credential Format

| Component | Value |
|-----------|-------|
| Username | `user` (fixed) |
| Password | 24-character random token |
| Format | `base64("user:{token}")` |

### Per-Project Isolation

- Each project gets a unique token at creation time
- Tokens cannot be used across projects
- Token rotation: Update DB + restart pod

---

## Implementation Details

### Key Files

| File | Purpose |
|------|---------|
| `app/api/projects/route.ts` | Token generation at project creation |
| `lib/k8s/sandbox-manager.ts` | Build ttydUrl with authorization parameter |
| `sandbox/entrypoint.sh` | Start ttyd with `-c` parameter |
| `sandbox/ttyd-startup.sh` | Session tracking for file uploads |
| `components/terminal/xterm-terminal.tsx` | Parse URL and send AuthToken |

### Backend: Token Generation

```typescript
// app/api/projects/route.ts
const ttydAuthToken = generateRandomString(24)

const environment = await tx.environment.create({
  data: {
    projectId: project.id,
    key: 'TTYD_ACCESS_TOKEN',
    value: ttydAuthToken,
    category: EnvironmentCategory.TTYD,
    isSecret: true,
  },
})
```

### Backend: URL Construction

```typescript
// lib/k8s/sandbox-manager.ts
const baseTtydUrl = `https://${sandboxName}-ttyd.${ingressDomain}`
const ttydAccessToken = envVars['TTYD_ACCESS_TOKEN']

if (ttydAccessToken) {
  const credentials = `user:${ttydAccessToken}`
  const authBase64 = Buffer.from(credentials).toString('base64')
  ttydUrl = `${baseTtydUrl}?authorization=${authBase64}`
}
```

### Container: entrypoint.sh

```bash
#!/bin/bash

# Validate required environment variables
if [ -z "$TTYD_ACCESS_TOKEN" ]; then
    echo "ERROR: TTYD_ACCESS_TOKEN environment variable is not set"
    exit 1
fi

# Build HTTP Basic Auth credential
TTYD_CREDENTIAL="user:${TTYD_ACCESS_TOKEN}"

# Start ttyd with authentication
exec ttyd \
    -T xterm-256color \
    -W \
    -a \
    -c "$TTYD_CREDENTIAL" \
    -t "$THEME" \
    /usr/local/bin/ttyd-startup.sh
```

### Container: ttyd-startup.sh

```bash
#!/bin/bash
# NOTE: Authentication is handled by ttyd -c at HTTP layer
# This script only handles session tracking

# Arguments (via ?arg=...):
#   $1 - TERMINAL_SESSION_ID

if [ "$#" -ge 1 ] && [ -n "$1" ]; then
    if [[ ! "$1" =~ ^[a-zA-Z0-9_-]+$ ]]; then
        echo "ERROR: Invalid session ID format"
        exit 1
    fi

    TERMINAL_SESSION_ID="$1"
    export TERMINAL_SESSION_ID
    echo "$$" > "/tmp/.terminal-session-${TERMINAL_SESSION_ID}"
fi

exec /bin/bash
```

### Frontend: Terminal Connection

```typescript
// components/terminal/xterm-terminal.tsx

const parseUrl = (): { wsFullUrl: string; authorization: string } | null => {
  const url = new URL(wsUrl)
  const authorization = url.searchParams.get('authorization') || ''

  if (!authorization) {
    console.error('[XtermTerminal] No authorization found in URL')
    return null
  }

  // Add session ID for file upload cwd detection
  url.searchParams.append('arg', terminalSessionId.current)

  const wsProtocol = url.protocol === 'https:' ? 'wss:' : 'ws:'
  const wsPath = url.pathname.replace(/\/$/, '') + '/ws'
  const wsFullUrl = `${wsProtocol}//${url.host}${wsPath}${url.search}`

  return { wsFullUrl, authorization }
}

socket.onopen = () => {
  // AuthToken required when ttyd started with -c parameter
  const initMsg = JSON.stringify({
    AuthToken: authorization,
    columns: terminal.cols,
    rows: terminal.rows,
  })
  socket.send(textEncoder.encode(initMsg))
}
```

---

## Session Tracking

The session tracking feature enables file uploads to the terminal's current working directory.

### Flow

1. **Frontend** generates unique session ID: `terminal-{timestamp}-{random}`
2. **URL** includes session ID: `?arg=SESSION_ID`
3. **ttyd-startup.sh** stores shell PID: `/tmp/.terminal-session-{SESSION_ID}`
4. **Backend API** reads PID to get cwd: `/proc/{PID}/cwd`
5. **File uploads** go to the detected directory

### Session File

```bash
# Location
/tmp/.terminal-session-{SESSION_ID}

# Content
{shell_pid}

# Example
/tmp/.terminal-session-terminal-1234567890-abc123
# Contains: 12345 (the bash PID)
```

---

## Troubleshooting

### Authentication Failed (401)

**Symptoms:**
- WebSocket connection fails with 401
- Browser may show Basic Auth popup (should not happen with `?authorization=`)

**Causes:**
- `TTYD_ACCESS_TOKEN` not set in container
- `authorization` URL parameter missing or incorrect
- `AuthToken` not included in WebSocket JSON message

**Solutions:**
1. Check environment variable:
   ```bash
   kubectl exec -it <pod-name> -n <namespace> -- env | grep TTYD_ACCESS_TOKEN
   ```

2. Verify URL has authorization parameter:
   ```
   ?authorization=dXNlcjp4eHh4eHh4eHh4
   ```

3. Check WebSocket JSON message includes AuthToken

### Session ID Not Working

**Symptoms:**
- File uploads go to root directory instead of current directory
- `/tmp/.terminal-session-*` file not found

**Causes:**
- Session ID not passed in URL
- ttyd not started with `-a` flag
- ttyd-startup.sh not storing PID

**Solutions:**
1. Check URL has arg parameter:
   ```
   ?authorization=xxx&arg=terminal-1234567890-abc123
   ```

2. Verify session file created:
   ```bash
   kubectl exec -it <pod-name> -n <namespace> -- ls -la /tmp/.terminal-session-*
   ```

3. Verify ttyd started with `-a` flag in entrypoint.sh

### Terminal Hangs

**Symptoms:**
- WebSocket connects but no shell prompt
- No output in terminal

**Causes:**
- Authentication failed silently
- ttyd-startup.sh exiting with error

**Solutions:**
1. Check ttyd logs:
   ```bash
   kubectl logs <pod-name> -n <namespace>
   ```

2. Manually test ttyd-startup.sh:
   ```bash
   kubectl exec -it <pod-name> -n <namespace> -- /usr/local/bin/ttyd-startup.sh test-session
   ```

---

## Security Comparison

| Aspect | Previous (Shell Auth) | Current (HTTP Basic Auth) |
|--------|----------------------|---------------------------|
| Auth timing | At shell startup | At HTTP/WebSocket handshake |
| URL format | `?arg=TOKEN&arg=SESSION_ID` | `?authorization=base64&arg=SESSION_ID` |
| Failure behavior | `sleep infinity` | HTTP 401 response |
| ttyd parameter | No `-c` | `-c user:$TOKEN` |
| WebSocket JSON | No AuthToken | AuthToken required |
| Token in URL | Plain text | Base64 encoded |

---

## References

- [ttyd GitHub Repository](https://github.com/tsl0922/ttyd)
- [ttyd Protocol Documentation](https://github.com/tsl0922/ttyd/blob/main/docs/protocol.md)
- [Kubernetes Secrets](https://kubernetes.io/docs/concepts/configuration/secret/)
- [FullstackAgent Architecture](./TECHNICAL_DOCUMENTATION.md)

---

## Changelog

- **2024-12-17**: Migrated to HTTP Basic Auth with `?authorization=` URL parameter
- **2025-01-19**: Initial shell script authentication