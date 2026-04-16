#!/bin/bash
# =============================================================================
# Sandbox Entrypoint Script
# =============================================================================
#
# Sets up Codex configuration, starts code-server, and starts ttyd web terminal.
#
# Authentication Flow:
#   ttyd-auth.sh receives the access token via ?arg=TOKEN and validates it
#   against the TTYD_ACCESS_TOKEN environment variable.
#
# Required Environment Variables:
#   TTYD_ACCESS_TOKEN - Access token for terminal authentication
#
# Optional Environment Variables:
#   CODEX_API_KEY  - API key for Codex (written to ~/.codex/auth.json)
#   CODEX_BASE_URL - LLM API base URL for Codex (written to ~/.codex/config.toml)
#
# =============================================================================

set -euo pipefail

FULLING_USER="${FULLING_USER:-fulling}"
FULLING_GROUP="${FULLING_GROUP:-fulling}"
FULLING_HOME="${FULLING_HOME:-/home/fulling}"
SKEL_DIR="${SKEL_DIR:-/etc/skel}"
TTYD_AUTH_SCRIPT="${TTYD_AUTH_SCRIPT:-/usr/local/bin/ttyd-auth.sh}"
FULLING_WORKSPACE="${FULLING_WORKSPACE:-$FULLING_HOME/next}"
EDITOR_PASSWORD="${EDITOR_PASSWORD:-${TTYD_ACCESS_TOKEN:-}}"

maybe_chown() {
    if [ "$(id -u)" -eq 0 ]; then
        chown "$@"
    fi
}

mkdir -p "$FULLING_HOME"
mkdir -p "$FULLING_WORKSPACE"
export HOME="$FULLING_HOME"
export USER="$FULLING_USER"
export LOGNAME="$FULLING_USER"
export CODEX_HOME="${CODEX_HOME:-$FULLING_HOME/.codex}"

# -----------------------------------------------------------------------------
# Validate required environment variables
# -----------------------------------------------------------------------------
if [ -z "${TTYD_ACCESS_TOKEN:-}" ]; then
    echo "ERROR: TTYD_ACCESS_TOKEN environment variable is not set"
    echo "This is required for terminal authentication"
    exit 1
fi

# -----------------------------------------------------------------------------
# Copy shell config files from skeleton to PVC-mounted home directory
# On first run the PVC is empty, so .bashrc needs to be copied
# -----------------------------------------------------------------------------
for skelfile in .bashrc .tmux.conf; do
    if [ ! -f "$FULLING_HOME/$skelfile" ] && [ -f "$SKEL_DIR/$skelfile" ]; then
        cp "$SKEL_DIR/$skelfile" "$FULLING_HOME/$skelfile"
        maybe_chown "$FULLING_USER:$FULLING_GROUP" "$FULLING_HOME/$skelfile"
    fi
done

# -----------------------------------------------------------------------------
# Setup Codex configuration
# Writes ~/.codex/config.toml and ~/.codex/auth.json from environment variables.
# These are regenerated on every container start so settings changes take effect
# after pod restart.
# -----------------------------------------------------------------------------
CODEX_CONFIG_DIR="$CODEX_HOME"
CODEX_CONFIG_FILE="${CODEX_CONFIG_DIR}/config.toml"
CODEX_AUTH_FILE="${CODEX_CONFIG_DIR}/auth.json"

# Write config.toml if CODEX_BASE_URL is set
if [ -n "${CODEX_BASE_URL:-}" ]; then
    mkdir -p "$CODEX_CONFIG_DIR"
    cat > "$CODEX_CONFIG_FILE" << CODEX_CONFIG_EOF
service_tier = "fast"
model_provider = "litellm"

[model_providers.litellm]
name = "OpenAI"
base_url = "${CODEX_BASE_URL}"
wire_api = "responses"
requires_openai_auth = true
CODEX_CONFIG_EOF
    maybe_chown "$FULLING_USER:$FULLING_GROUP" "$CODEX_CONFIG_FILE"
    echo "✓ Codex config initialized (base_url: ${CODEX_BASE_URL})"
fi

# Write auth.json if CODEX_API_KEY is set
if [ -n "${CODEX_API_KEY:-}" ]; then
    mkdir -p "$CODEX_CONFIG_DIR"
    cat > "$CODEX_AUTH_FILE" << CODEX_AUTH_EOF
{
  "auth_mode": "apikey",
  "OPENAI_API_KEY": "${CODEX_API_KEY}"
}
CODEX_AUTH_EOF
    maybe_chown "$FULLING_USER:$FULLING_GROUP" "$CODEX_AUTH_FILE"
    echo "✓ Codex auth configured"
fi

# Ensure proper ownership of codex config directory
if [ -d "$CODEX_CONFIG_DIR" ]; then
    maybe_chown -R "$FULLING_USER:$FULLING_GROUP" "$CODEX_CONFIG_DIR" 2>/dev/null || true
fi

# -----------------------------------------------------------------------------
# Terminal theme configuration
# ttyd expects theme in JSON format via -t parameter
# -----------------------------------------------------------------------------
THEME='theme={
 "background":"#262626",
 "foreground":"#BCBCBC",
 "cursor":"#BCBCBC",
 "black":"#1C1C1C",
 "red":"#AF5F5F",
 "green":"#5F875F",
 "yellow":"#87875F",
 "blue":"#5F87AF",
 "magenta":"#5F5F87",
 "cyan":"#5F8787",
 "white":"#6C6C6C",
 "brightBlack":"#444444",
 "brightRed":"#FF8700",
 "brightGreen":"#87AF87",
 "brightYellow":"#FFFFAF",
 "brightBlue":"#8FAFD7",
 "brightMagenta":"#8787AF",
 "brightCyan":"#5FAFAF",
 "brightWhite":"#FFFFFF"
}'

# -----------------------------------------------------------------------------
# Configure and start code-server as a background daemon.
# The editor listens on port 3773 and serves the project workspace.
# -----------------------------------------------------------------------------
CODE_SERVER_CONFIG_DIR="${FULLING_HOME}/.config/code-server"
CODE_SERVER_CONFIG_FILE="${CODE_SERVER_CONFIG_DIR}/config.yaml"

mkdir -p "$CODE_SERVER_CONFIG_DIR"
cat > "$CODE_SERVER_CONFIG_FILE" << CODE_SERVER_CONFIG_EOF
bind-addr: 0.0.0.0:3773
auth: password
password: ${EDITOR_PASSWORD}
cert: false
CODE_SERVER_CONFIG_EOF
maybe_chown -R "$FULLING_USER:$FULLING_GROUP" "$CODE_SERVER_CONFIG_DIR"

if command -v code-server >/dev/null 2>&1; then
    echo "Starting code-server (port 3773)..."
    PASSWORD="$EDITOR_PASSWORD" \
    HOME="$HOME" \
    USER="$USER" \
    LOGNAME="$LOGNAME" \
    CODEX_HOME="$CODEX_HOME" \
    nohup code-server "$FULLING_WORKSPACE" > /tmp/code-server.log 2>&1 &
    echo "✓ code-server started (PID: $!)"
else
    echo "ERROR: code-server is not installed"
    exit 1
fi

# -----------------------------------------------------------------------------
# Verify auth script exists
# -----------------------------------------------------------------------------
if [ ! -f "$TTYD_AUTH_SCRIPT" ]; then
    echo "ERROR: ttyd-auth.sh not found at $TTYD_AUTH_SCRIPT"
    exit 1
fi

# -----------------------------------------------------------------------------
# Start ttyd with token-based authentication
# -----------------------------------------------------------------------------
# Parameters:
#   -T xterm-256color  : Terminal type
#   -W                 : Enable WebSocket compression
#   -a                 : Allow URL arguments (?arg=TOKEN&arg=SESSION_ID)
#   -t theme           : Terminal color theme
#
# ttyd-auth.sh receives:
#   $1 = ACCESS_TOKEN (from first ?arg=)
#   $2 = SESSION_ID (from second ?arg=)
# -----------------------------------------------------------------------------
echo "Starting ttyd..."
exec ttyd \
    -T xterm-256color \
    -W \
    -a \
    -t "$THEME" \
    "$TTYD_AUTH_SCRIPT"
