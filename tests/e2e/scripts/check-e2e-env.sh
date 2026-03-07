#!/usr/bin/env bash
# check-e2e-env.sh — Verify Docker e2e environment is running
#
# Quick health check to ensure postgres and backend containers are running
# before attempting to run e2e tests. Exits with code 1 if not ready.

set -euo pipefail

BACKEND_URL="http://localhost:8081/actuator/health"
POSTGRES_CONTAINER="busmate-e2e-postgres"
BACKEND_CONTAINER="busmate-e2e-backend"

echo "Checking e2e environment status..."

# Check if Docker is running
if ! docker info >/dev/null 2>&1; then
  echo "❌ ERROR: Docker is not running." >&2
  echo "   Please start Docker Desktop and try again." >&2
  exit 1
fi

# Check if postgres container is running
if ! docker ps --filter "name=$POSTGRES_CONTAINER" --filter "status=running" | grep -q "$POSTGRES_CONTAINER"; then
  echo "❌ ERROR: PostgreSQL container is not running." >&2
  echo "   Start the e2e environment with: pnpm run e2e:env:start" >&2
  exit 1
fi

# Check if backend container is running
if ! docker ps --filter "name=$BACKEND_CONTAINER" --filter "status=running" | grep -q "$BACKEND_CONTAINER"; then
  echo "❌ ERROR: Backend container is not running." >&2
  echo "   Start the e2e environment with: pnpm run e2e:env:start" >&2
  exit 1
fi

# Check if backend is healthy
if ! curl -sf "$BACKEND_URL" >/dev/null 2>&1; then
  echo "⚠️  WARNING: Backend container is running but not healthy yet." >&2
  echo "   It may still be starting up. Wait a moment and try again." >&2
  echo "   Check logs with: pnpm run e2e:env:logs" >&2
  exit 1
fi

echo "✅ E2E environment is ready!"
echo "   PostgreSQL: localhost:5433 (healthy)"
echo "   Backend:    http://localhost:8081 (healthy)"
exit 0
