#!/usr/bin/env bash
# e2e-env.sh — BusMate E2E Test Environment Manager
#
# Manages the Docker-based isolated test environment used by Playwright e2e tests.
# Spins up a dedicated PostgreSQL database and Spring Boot backend that are
# completely separate from the development environment.
#
# Usage:
#   ./tests/e2e/scripts/e2e-env.sh start    Start the test environment
#   ./tests/e2e/scripts/e2e-env.sh stop     Stop and clean up (removes volumes)
#   ./tests/e2e/scripts/e2e-env.sh status   Show service status
#   ./tests/e2e/scripts/e2e-env.sh logs     Tail service logs

set -euo pipefail

# ── Paths ─────────────────────────────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
COMPOSE_FILE="$REPO_ROOT/docker-compose.e2e.yml"

# ── Configuration ─────────────────────────────────────────────────────────────
BACKEND_HEALTH_URL="http://localhost:8081/actuator/health"
BACKEND_MAX_WAIT=300   # seconds to wait for Spring Boot to become healthy

# ── Helpers ───────────────────────────────────────────────────────────────────
command_exists() {
  command -v "$1" >/dev/null 2>&1
}

check_prerequisites() {
  if ! command_exists docker; then
    echo "ERROR: Docker is not installed or not in PATH." >&2
    exit 1
  fi

  if ! docker compose version >/dev/null 2>&1; then
    echo "ERROR: Docker Compose v2 is not available." >&2
    echo "       Install Docker Desktop or the docker-compose-plugin package." >&2
    exit 1
  fi
}

# Poll the backend health endpoint until it returns 2xx or the timeout expires.
wait_for_backend() {
  local elapsed=0
  echo "Waiting for backend to become healthy (timeout: ${BACKEND_MAX_WAIT}s)..."

  while [ "$elapsed" -lt "$BACKEND_MAX_WAIT" ]; do
    if curl -sf "$BACKEND_HEALTH_URL" >/dev/null 2>&1; then
      echo "Backend is healthy."
      return 0
    fi
    sleep 5
    elapsed=$((elapsed + 5))
    printf "  %3ds elapsed — still starting...\r" "$elapsed"
  done

  echo ""
  echo "ERROR: Backend did not become healthy within ${BACKEND_MAX_WAIT}s." >&2
  echo "       Check logs with: $0 logs" >&2
  return 1
}

# ── Commands ──────────────────────────────────────────────────────────────────
cmd_start() {
  check_prerequisites

  echo "Starting BusMate e2e test environment..."
  echo "  Compose file : $COMPOSE_FILE"
  echo ""

  # Build images and start services in detached mode
  docker compose -f "$COMPOSE_FILE" up -d --build

  echo ""
  wait_for_backend

  echo ""
  echo "E2E environment is ready."
  echo ""
  echo "  PostgreSQL : localhost:5433  (db/user: busmate_e2e)"
  echo "  Backend    : http://localhost:8081"
  echo ""
  echo "Next step:"
  echo "  pnpm run e2e:docker   — run Playwright tests against this environment"
}

cmd_stop() {
  check_prerequisites

  echo "Stopping BusMate e2e test environment..."
  # -v removes named volumes so the database is fully wiped, ensuring a clean
  # state the next time the environment is started.
  docker compose -f "$COMPOSE_FILE" down -v

  echo "Test environment stopped and volumes removed."
}

cmd_status() {
  check_prerequisites
  docker compose -f "$COMPOSE_FILE" ps
}

cmd_logs() {
  check_prerequisites
  docker compose -f "$COMPOSE_FILE" logs --follow --tail=100 "${2:-}"
}

# ── Entry point ───────────────────────────────────────────────────────────────
case "${1:-}" in
  start)  cmd_start ;;
  stop)   cmd_stop ;;
  status) cmd_status ;;
  logs)   cmd_logs "$@" ;;
  *)
    echo "BusMate E2E Environment Manager"
    echo ""
    echo "Usage: $0 <command>"
    echo ""
    echo "Commands:"
    echo "  start    Build images and start PostgreSQL + Spring Boot backend"
    echo "  stop     Stop services and remove volumes (full clean-up)"
    echo "  status   Show the running status of all services"
    echo "  logs     Tail logs for all services (pass a service name to filter)"
    echo ""
    echo "Examples:"
    echo "  $0 start"
    echo "  $0 logs backend"
    echo "  $0 stop"
    exit 1
    ;;
esac
