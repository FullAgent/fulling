#!/bin/bash
# =============================================================================
# Build the runtime Docker image
# =============================================================================
#
# This script builds the runtime Docker image locally.
#
# Usage:
#   cd runtime && ./build.sh
#
# =============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# Read version
VERSION=$(cat "$SCRIPT_DIR/VERSION" 2>/dev/null || echo "latest")
IMAGE_REPO="${IMAGE_REPO:-ghcr.io/fullagent/fullstack-web-runtime}"
IMAGE_NAME="${IMAGE_REPO}:${VERSION}"

echo "=== Building runtime image: ${IMAGE_NAME} ==="

# Remove legacy T3 build artifacts if they are present from older worktrees.
rm -rf "$SCRIPT_DIR/t3code-dist"

# Build Docker image
echo "=== Building Docker image ==="
docker build -t "$IMAGE_NAME" "$SCRIPT_DIR"

echo ""
echo "✓ Image built: ${IMAGE_NAME}"
echo "  Run: docker push ${IMAGE_NAME}"
