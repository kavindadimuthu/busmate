#!/usr/bin/env bash

# Full Backup Export Script
# Creates a complete database backup with timestamp using PostgreSQL custom format
# Suitable for disaster recovery and point-in-time snapshots

set -e

# Load helper functions and variables
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/helpers.sh"

# Main execution
main() {
  print_header "Full Database Backup"
  
  # Validate prerequisites
  validate_database_url
  check_pg_tools
  ensure_dumps_dir
  
  # Set output file path with timestamp
  local backup_file="${OUT_DIR}/full-${TIMESTAMP}.dump"
  
  print_info "Creating full backup at: ${backup_file}"
  print_info "Timestamp: ${TIMESTAMP}"
  
  # Create full backup in custom format
  # -F c: use custom format (compressed and allows selective restore)
  # -v: verbose mode for progress output
  # --no-owner: do not output commands to set ownership
  # --no-privileges: do not dump access privileges
  # custom format includes both schema and data
  pg_dump "${DATABASE_URL}" \
    -F c \
    -v \
    --no-owner \
    --no-privileges \
    -f "${backup_file}"
  
  # Verify the backup file was created and has content
  if [ -s "${backup_file}" ]; then
    local file_size=$(du -h "${backup_file}" | cut -f1)
    print_success "Full backup created successfully (${file_size})"
    echo "Output: ${backup_file}"
    echo ""
    print_info "To restore this backup, use:"
    echo "  pg_restore -d \$DATABASE_URL -v -c ${backup_file}"
  else
    print_error "Backup export failed or produced empty file"
    exit 1
  fi
  
  # Optional: List previous backups
  local backup_count=$(find "${OUT_DIR}" -name "full-*.dump" 2>/dev/null | wc -l)
  if [ "${backup_count}" -gt 1 ]; then
    echo ""
    print_info "Total backups in ${OUT_DIR}: ${backup_count}"
    echo "Consider cleaning up old backups periodically"
  fi
}

# Run main function
main "$@"
