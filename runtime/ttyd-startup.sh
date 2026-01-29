#!/bin/bash
# =============================================================================
# ttyd Session Handler Script
# =============================================================================
#
# This script handles terminal session setup after authentication.
# NOTE: Authentication is now handled by ttyd's HTTP Basic Auth (-c parameter).
#       This script only handles session tracking for file upload cwd detection.
#
# Arguments (passed via URL ?arg=...):
#   $1 - TERMINAL_SESSION_ID (optional, for file upload directory tracking)
#
# Session Tracking:
#   - Stores shell PID in /tmp/.terminal-session-{SESSION_ID}
#   - Backend reads PID to detect current working directory via /proc/{PID}/cwd
#   - Used for file uploads to go to the terminal's current directory
#
# =============================================================================

# -----------------------------------------------------------------------------
# Handle terminal session ID for file upload directory tracking
# -----------------------------------------------------------------------------
if [ "$#" -ge 1 ] && [ -n "$1" ]; then
    # Validate format: only allow alphanumeric, hyphens, and underscores
    # This prevents path traversal and injection attacks
    if [[ ! "$1" =~ ^[a-zA-Z0-9_-]+$ ]]; then
        echo "ERROR: Invalid session ID format"
        echo "Session ID must contain only letters, numbers, hyphens, and underscores"
        exit 1
    fi

    TERMINAL_SESSION_ID="$1"
    export TERMINAL_SESSION_ID

    # Store shell PID in session file
    # This allows backend to find the shell's working directory via /proc/$$/cwd
    SESSION_FILE="/tmp/.terminal-session-${TERMINAL_SESSION_ID}"
    echo "$$" > "$SESSION_FILE"
fi

# -----------------------------------------------------------------------------
# Welcome message
# -----------------------------------------------------------------------------
echo ""
echo "👋 Welcome to your FullstackAgent Sandbox!"
echo "========================================"
echo ""
echo "🚀 Getting Started:"
echo "   Your Next.js project is ready in this directory."
echo ""
echo "📦 1. Install dependencies:"
echo "      pnpm install"
echo ""
echo "▶️  2. Start the development server:"
echo "      pnpm dev"
echo ""
echo "🤖 3. Use AI assistance:"
echo "      claude"
echo ""
echo "📎 4. Upload files:"
echo "      • Drag and drop files to the terminal"
echo "      • Paste images to upload"
echo "      • Files will be uploaded to the current directory"
echo ""
echo "Happy coding!"
echo ""

# -----------------------------------------------------------------------------
# Start interactive bash shell
# -----------------------------------------------------------------------------
exec /bin/bash