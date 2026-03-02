#!/usr/bin/env bash

# Schema Export Script
# Exports the database schema (structure only, no data) for version control
# Output is deterministic to produce clean git diffs

set -e

# Load helper functions and variables
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/helpers.sh"

# Main execution
main() {
  print_header "Database Schema Export"
  
  # Validate prerequisites
  validate_database_url
  check_pg_tools
  ensure_dumps_dir
  
  # Set output file path
  local schema_file="${OUT_DIR}/schema.sql"
  
  print_info "Exporting schema to: ${schema_file}"
  
  # Export schema only, excluding ownership and privileges for deterministic output
  # --schema-only: dump only the object definitions (schema), not data
  # --no-owner: do not output commands to set ownership of objects
  # --no-privileges: do not dump access privileges (GRANT/REVOKE commands)
  # --no-comments: do not dump comments (optional, for cleaner diffs)
  pg_dump "${DATABASE_URL}" \
    --schema-only \
    --no-owner \
    --no-privileges \
    --no-comments \
    > "${schema_file}"
  
  # Verify the file was created and has content
  if [ -s "${schema_file}" ]; then
    local file_size=$(du -h "${schema_file}" | cut -f1)
    print_success "Schema exported successfully (${file_size})"
    echo "Output: ${schema_file}"
  else
    print_error "Schema export failed or produced empty file"
    exit 1
  fi
}

# Run main function
main "$@"
