#!/usr/bin/env bash

# Data-Only Export Script
# Exports all data from all tables without schema definitions
# Output is a plain SQL file with INSERT statements for easy inspection and portability

set -e

# Load helper functions and variables
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/helpers.sh"

# Main execution
main() {
  print_header "Data-Only Export"
  
  # Validate prerequisites
  validate_database_url
  check_pg_tools
  ensure_dumps_dir
  
  # Set output file path
  local data_file="${OUT_DIR}/data-only.sql"
  
  print_info "Exporting all table data to: ${data_file}"
  
  # Export data only from all tables as plain SQL
  # --data-only: dump only data, not schema definitions
  # --no-owner: do not output commands to set ownership
  # --no-privileges: do not dump access privileges
  # --column-inserts: dump data as INSERT commands with explicit column names
  #   (more readable and portable across PostgreSQL versions)
  # --disable-triggers: disable triggers during data load to avoid constraint issues
  pg_dump "${DATABASE_URL}" \
    --data-only \
    --no-owner \
    --no-privileges \
    --column-inserts \
    --disable-triggers \
    > "${data_file}"
  
  # Verify the file was created and has content
  if [ -s "${data_file}" ]; then
    local file_size=$(du -h "${data_file}" | cut -f1)
    local table_count=$(grep -c "^-- Data for Name:" "${data_file}" 2>/dev/null || echo "unknown")
    print_success "Data exported successfully (${file_size}, ${table_count} tables)"
    echo "Output: ${data_file}"
  else
    print_error "Data export failed or produced empty file"
    echo "This may be normal if the database has no data" >&2
    exit 1
  fi
}

# Run main function
main "$@"
