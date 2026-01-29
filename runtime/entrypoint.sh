#!/bin/bash
# =============================================================================
# ttyd Entrypoint Script
# =============================================================================
#
# Starts ttyd web terminal with HTTP Basic Auth enabled.
#
# Authentication Flow:
# 1. ttyd validates credentials at HTTP/WebSocket layer via -c parameter
# 2. URL format: ?authorization=base64(user:password)&arg=SESSION_ID
# 3. ttyd-startup.sh handles session tracking (not auth) for file upload cwd detection
#
# Required Environment Variables:
#   TTYD_ACCESS_TOKEN - Password for HTTP Basic Auth (username is 'user')
#
# Optional URL Parameters (via -a flag):
#   arg=SESSION_ID - Terminal session ID for file upload directory tracking
#
# =============================================================================

set -euo pipefail

# -----------------------------------------------------------------------------
# Validate required environment variables
# -----------------------------------------------------------------------------
if [ -z "$TTYD_ACCESS_TOKEN" ]; then
    echo "ERROR: TTYD_ACCESS_TOKEN environment variable is not set"
    echo "This is required for terminal authentication"
    exit 1
fi

# -----------------------------------------------------------------------------
# Build HTTP Basic Auth credential
# Format: username:password (username is fixed as 'user')
# -----------------------------------------------------------------------------
TTYD_CREDENTIAL="user:${TTYD_ACCESS_TOKEN}"

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
# Verify startup script exists
# -----------------------------------------------------------------------------
if [ ! -f /usr/local/bin/ttyd-startup.sh ]; then
    echo "ERROR: ttyd-startup.sh not found at /usr/local/bin/ttyd-startup.sh"
    exit 1
fi

# -----------------------------------------------------------------------------
# Start ttyd with authentication
# -----------------------------------------------------------------------------
# Parameters:
#   -T xterm-256color  : Terminal type (widely supported)
#   -W                 : Enable WebSocket compression
#   -a                 : Allow URL arguments (?arg=SESSION_ID) to be passed to command
#   -c credential      : HTTP Basic Auth (user:password)
#   -t theme           : Terminal color theme
#
# The command (ttyd-startup.sh) receives URL arguments:
#   $1 = SESSION_ID (from ?arg=...)
#
# Authentication happens at HTTP/WebSocket level by ttyd.
# ttyd-startup.sh only handles session tracking for file upload cwd detection.
# -----------------------------------------------------------------------------
echo "Starting ttyd with HTTP Basic Auth..."
exec ttyd \
    -T xterm-256color \
    -W \
    -a \
    -c "$TTYD_CREDENTIAL" \
    -t "$THEME" \
    /usr/local/bin/ttyd-startup.sh