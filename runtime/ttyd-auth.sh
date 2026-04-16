#!/bin/bash
# ttyd authentication wrapper script
# Validates TTYD_ACCESS_TOKEN before granting shell access
# Uses tmux for per-session persistence (survives browser refresh/tab close)
#
# Arguments (passed via URL ?arg=...&arg=...):
#   $1 - TTYD_ACCESS_TOKEN (required)
#   $2 - TERMINAL_SESSION_ID (optional, for session persistence + file upload CWD)

# Get the expected token from environment variable
EXPECTED_TOKEN="${TTYD_ACCESS_TOKEN:-}"

# Check if token is configured
if [ -z "$EXPECTED_TOKEN" ]; then
    echo "ERROR: TTYD_ACCESS_TOKEN is not configured"
    echo "Please contact your system administrator"
    sleep infinity
fi

# Check if token was provided as argument
if [ "$#" -lt 1 ]; then
    echo "ERROR: Authentication failed - no token provided"
    sleep infinity
fi

PROVIDED_TOKEN="$1"

# Validate token
if [ "$PROVIDED_TOKEN" != "$EXPECTED_TOKEN" ]; then
    echo "ERROR: Authentication failed - invalid token"
    sleep infinity
fi

# Authentication successful
echo "✓ Authentication successful"

# Handle terminal session ID
SESSION_FILE=""
TERMINAL_SESSION_ID=""
TMUX_SESSION_NAME=""
if [ "$#" -ge 2 ] && [ -n "$2" ]; then
    # Validate format: only allow alphanumeric, hyphens, and underscores
    if [[ ! "$2" =~ ^[a-zA-Z0-9_-]+$ ]]; then
        echo "ERROR: Invalid session ID format"
        sleep infinity
    fi
    TERMINAL_SESSION_ID="$2"
    export TERMINAL_SESSION_ID
    SESSION_FILE="/tmp/.terminal-session-${TERMINAL_SESSION_ID}"
    TMUX_SESSION_NAME="terminal-${TERMINAL_SESSION_ID}"
fi

write_tmux_pane_pid() {
    if [ -z "$SESSION_FILE" ] || [ -z "$TMUX_SESSION_NAME" ]; then
        return
    fi

    PANE_PID="$(tmux display-message -p -t "$TMUX_SESSION_NAME":0 '#{pane_pid}' 2>/dev/null | tr -d '\r\n')"
    if [ -n "$PANE_PID" ]; then
        echo "$PANE_PID" > "$SESSION_FILE"
    fi
}

if [ -n "$TERMINAL_SESSION_ID" ]; then
    if tmux has-session -t "$TMUX_SESSION_NAME" 2>/dev/null; then
        echo "↻ Reconnecting to session..."
        write_tmux_pane_pid
        exec tmux attach-session -t "$TMUX_SESSION_NAME"
    else
        echo ""
        echo "Welcome to your FullstackAgent Sandbox!"
        echo "========================================"
        echo ""
        echo "  codex         - Start AI coding assistant"
        echo "  pnpm install  - Install dependencies"
        echo "  pnpm dev      - Start dev server"
        echo ""

        tmux new-session -d -s "$TMUX_SESSION_NAME" /bin/bash
        sleep 0.2
        write_tmux_pane_pid
        exec tmux attach-session -t "$TMUX_SESSION_NAME"
    fi
else
    # No session ID — plain bash (fallback)
    if [ -n "$SESSION_FILE" ]; then
        echo "$$" > "$SESSION_FILE"
    fi

    echo ""
    echo "Welcome to your FullstackAgent Sandbox!"
    echo "========================================"
    echo ""
    echo "  codex         - Start AI coding assistant"
    echo "  pnpm install  - Install dependencies"
    echo "  pnpm dev      - Start dev server"
    echo ""

    exec /bin/bash
fi
