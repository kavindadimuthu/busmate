#!/usr/bin/env bash

# Combined Export Runner
# Executes all database export scripts in sequence
# Use this for a complete database snapshot (schema, reference data, and full backup)

set -e

# Load helper functions and variables
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/helpers.sh"

# Main execution
main() {
  print_header "Running All Database Exports"
  
  local start_time=$(date +%s)
  
  print_info "This will run five export operations:"
  echo "  1. Schema export (for version control)"
  echo "  2. Reference data export (for version control)"
  echo "  3. Data-only export (all table data as SQL)"
  echo "  4. Full SQL export (schema + data as .sql)"
  echo "  5. Full backup (schema + data as .dump)"
  echo ""
  
  # Track success/failure
  local failed_exports=()
  
  # Run schema export
  print_header "Step 1/5: Schema Export"
  if bash "${SCRIPT_DIR}/export-schema.sh"; then
    print_success "Schema export completed"
  else
    print_error "Schema export failed"
    failed_exports+=("schema")
  fi
  
  echo ""
  echo ""
  
  # Run reference data export
  print_header "Step 2/5: Reference Data Export"
  if bash "${SCRIPT_DIR}/export-reference.sh"; then
    print_success "Reference data export completed"
  else
    print_error "Reference data export failed"
    failed_exports+=("reference-data")
  fi
  
  echo ""
  echo ""
  
  # Run data-only export
  print_header "Step 3/5: Data-Only Export"
  if bash "${SCRIPT_DIR}/export-data.sh"; then
    print_success "Data-only export completed"
  else
    print_error "Data-only export failed"
    failed_exports+=("data-only")
  fi
  
  echo ""
  echo ""
  
  # Run full SQL export
  print_header "Step 4/5: Full SQL Export"
  if bash "${SCRIPT_DIR}/export-full-sql.sh"; then
    print_success "Full SQL export completed"
  else
    print_error "Full SQL export failed"
    failed_exports+=("full-sql")
  fi
  
  echo ""
  echo ""
  
  # Run full backup (.dump)
  print_header "Step 5/5: Full Backup (.dump)"
  if bash "${SCRIPT_DIR}/export-full.sh"; then
    print_success "Full backup completed"
  else
    print_error "Full backup failed"
    failed_exports+=("full-backup")
  fi
  
  echo ""
  echo ""
  
  # Summary
  print_header "Export Summary"
  
  local end_time=$(date +%s)
  local duration=$((end_time - start_time))
  
  if [ ${#failed_exports[@]} -eq 0 ]; then
    print_success "All exports completed successfully in ${duration} seconds"
    echo ""
    echo "Generated files in ${OUT_DIR}:"
    ls -lh "${OUT_DIR}/" | tail -n +2
    exit 0
  else
    print_error "Some exports failed: ${failed_exports[*]}"
    echo "Duration: ${duration} seconds"
    exit 1
  fi
}

# Run main function
main "$@"
