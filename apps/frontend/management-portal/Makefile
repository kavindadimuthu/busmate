.PHONY: help db-schema db-reference db-data db-full-sql db-backup db-all

# Default target - show help
help:
	@echo "BusMate Database Export Commands"
	@echo ""
	@echo "Available targets:"
	@echo "  make db-schema     - Export database schema (for version control)"
	@echo "  make db-reference  - Export reference/lookup table data"
	@echo "  make db-data       - Export all table data only (no schema)"
	@echo "  make db-full-sql   - Export full database as .sql (schema + data)"
	@echo "  make db-backup     - Create full database backup as .dump"
	@echo "  make db-all        - Run all export operations"
	@echo ""
	@echo "Prerequisites:"
	@echo "  - Set DATABASE_URL environment variable"
	@echo "  - Install PostgreSQL client tools (pg_dump, psql)"
	@echo ""
	@echo "Example:"
	@echo "  export DATABASE_URL='postgresql://user:pass@localhost:5432/busmate'"
	@echo "  make db-all"

# Export database schema only (for version control)
db-schema:
	@bash db/scripts/export-schema.sh

# Export reference data tables (for version control)
db-reference:
	@bash db/scripts/export-reference.sh

# Export all table data only, no schema (plain SQL)
db-data:
	@bash db/scripts/export-data.sh

# Export full database as plain SQL file (schema + data)
db-full-sql:
	@bash db/scripts/export-full-sql.sh

# Create full database backup in custom format (.dump)
db-backup:
	@bash db/scripts/export-full.sh

# Run all database exports
db-all:
	@bash db/scripts/export-all.sh
