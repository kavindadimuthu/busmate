#!/usr/bin/env bash

# Reference Data Export Script
# Exports data from specific reference/lookup tables for version control
# These are typically small tables with configuration or lookup data

set -e

# Load helper functions and variables
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/helpers.sh"

# Main execution
main() {
  print_header "Reference Data Export"
  
  # Validate prerequisites
  validate_database_url
  check_pg_tools
  ensure_dumps_dir
  
  # Set output file path
  local ref_data_file="${OUT_DIR}/reference-data.sql"
  
  # Check if any reference tables are defined
  if [ ${#REFERENCE_TABLES[@]} -eq 0 ]; then
    print_error "No reference tables defined in helpers.sh"
    echo "Please add table names to the REFERENCE_TABLES array" >&2
    exit 1
  fi
  
  print_info "Exporting ${#REFERENCE_TABLES[@]} reference tables:"
  for table in "${REFERENCE_TABLES[@]}"; do
    echo "  - ${table}"
  done
  
  print_info "Output file: ${ref_data_file}"
  
  # Build table list for pg_dump
  local table_args=()
  for table in "${REFERENCE_TABLES[@]}"; do
    table_args+=("--table=${table}")
  done
  
  # Export data only from specified tables
  # --data-only: dump only the data, not the schema (definitions)
  # --no-owner: do not output commands to set ownership
  # --no-privileges: do not dump access privileges
  # --column-inserts: dump data as INSERT commands with column names (more readable)
  # --rows-per-insert=100: combine multiple VALUES clauses per INSERT (more efficient)
  pg_dump "${DATABASE_URL}" \
    --data-only \
    --no-owner \
    --no-privileges \
    --column-inserts \
    --rows-per-insert=100 \
    "${table_args[@]}" \
    > "${ref_data_file}"
  
  # Verify the file was created and has content
  if [ -s "${ref_data_file}" ]; then
    local file_size=$(du -h "${ref_data_file}" | cut -f1)
    print_success "Reference data exported successfully (${file_size})"
    echo "Output: ${ref_data_file}"
  else
    print_error "Reference data export failed or produced empty file"
    echo "This may be normal if the reference tables are empty" >&2
    exit 1
  fi
}

# Run main function
main "$@"
