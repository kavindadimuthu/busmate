#!/usr/bin/env bash

# Database Export Helper Functions and Variables
# This script contains shared configuration and utility functions for all export scripts

set -e

# Color codes for output formatting
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly NC='\033[0m' # No Color

# Directory configuration
readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly DB_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
readonly OUT_DIR="${DB_DIR}/dumps"

# Timestamp for backup files (format: YYYY-MM-DD_HH-MM-SS)
readonly TIMESTAMP=$(date +%Y-%m-%d_%H-%M-%S)

# Reference tables - tables containing lookup data that should be version controlled
# Add or remove tables here as needed for your application
readonly REFERENCE_TABLES=(
  "roles"
  "permissions"
  "route_status"
  "vehicle_types"
  "fare_categories"
  "bus_types"
)

#######################################
# Validate that DATABASE_URL environment variable is set
# Globals:
#   DATABASE_URL
# Arguments:
#   None
# Returns:
#   0 if valid, exits with error code 1 if not
#######################################
validate_database_url() {
  if [ -z "${DATABASE_URL:-}" ]; then
    echo -e "${RED}ERROR: DATABASE_URL environment variable is not set${NC}" >&2
    echo "Please set DATABASE_URL in your environment or .env file" >&2
    echo "Example: export DATABASE_URL='postgresql://user:password@localhost:5432/dbname'" >&2
    exit 1
  fi
  
  echo -e "${GREEN}✓${NC} DATABASE_URL is configured"
}

#######################################
# Ensure the dumps directory exists
# Globals:
#   OUT_DIR
# Arguments:
#   None
# Returns:
#   0 on success
#######################################
ensure_dumps_dir() {
  if [ ! -d "${OUT_DIR}" ]; then
    echo "Creating dumps directory: ${OUT_DIR}"
    mkdir -p "${OUT_DIR}"
  fi
  echo -e "${GREEN}✓${NC} Dumps directory ready: ${OUT_DIR}"
}

#######################################
# Print a formatted header message
# Arguments:
#   $1 - Message to print
# Returns:
#   0 on success
#######################################
print_header() {
  local message="$1"
  echo ""
  echo "=========================================="
  echo "${message}"
  echo "=========================================="
  echo ""
}

#######################################
# Print a success message
# Arguments:
#   $1 - Message to print
# Returns:
#   0 on success
#######################################
print_success() {
  local message="$1"
  echo -e "${GREEN}✓ SUCCESS:${NC} ${message}"
}

#######################################
# Print an error message
# Arguments:
#   $1 - Message to print
# Returns:
#   0 on success
#######################################
print_error() {
  local message="$1"
  echo -e "${RED}✗ ERROR:${NC} ${message}" >&2
}

#######################################
# Print an info message
# Arguments:
#   $1 - Message to print
# Returns:
#   0 on success
#######################################
print_info() {
  local message="$1"
  echo -e "${YELLOW}ℹ${NC} ${message}"
}

#######################################
# Check if required PostgreSQL tools are available
# Arguments:
#   None
# Returns:
#   0 if tools exist, exits with error code 1 if not
#######################################
check_pg_tools() {
  local missing_tools=()
  
  if ! command -v pg_dump &> /dev/null; then
    missing_tools+=("pg_dump")
  fi
  
  if ! command -v psql &> /dev/null; then
    missing_tools+=("psql")
  fi
  
  if [ ${#missing_tools[@]} -gt 0 ]; then
    print_error "Required PostgreSQL tools not found: ${missing_tools[*]}"
    echo "Please install PostgreSQL client tools" >&2
    exit 1
  fi
  
  echo -e "${GREEN}✓${NC} PostgreSQL tools available"
}
