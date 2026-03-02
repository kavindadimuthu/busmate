#!/usr/bin/env bash

# Full SQL Export Script
# Creates a complete database export as a plain SQL file (schema + data)
# Unlike the .dump (custom format), this is human-readable and can be applied with psql

set -e

# Load helper functions and variables
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/helpers.sh"

# Main execution
main() {
  print_header "Full SQL Export"
  
  # Validate prerequisites
  validate_database_url
  check_pg_tools
  ensure_dumps_dir
  
  # Set output file path with timestamp
  local sql_file="${OUT_DIR}/full-${TIMESTAMP}.sql"
  
  print_info "Creating full SQL export at: ${sql_file}"
  print_info "Timestamp: ${TIMESTAMP}"
  
  # Export complete database as plain SQL
  # -F p (or default): plain-text SQL format
  # --no-owner: do not output commands to set ownership
  # --no-privileges: do not dump access privileges
  # Includes both schema definitions and all table data
  pg_dump "${DATABASE_URL}" \
    -F p \
    --no-owner \
    --no-privileges \
    > "${sql_file}"
  
  # Verify the file was created and has content
  if [ -s "${sql_file}" ]; then
    local file_size=$(du -h "${sql_file}" | cut -f1)
    print_success "Full SQL export created successfully (${file_size})"
    echo "Output: ${sql_file}"
    echo ""
    print_info "To restore this export, use:"
    echo "  psql \$DATABASE_URL < ${sql_file}"
  else
    print_error "Full SQL export failed or produced empty file"
    exit 1
  fi
}

# Run main function
main "$@"
