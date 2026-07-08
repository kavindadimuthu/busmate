# Database Migrations

## Current Strategy

This project currently uses **JPA `ddl-auto: update`** for database schema management in development. This means Hibernate automatically creates and updates tables based on entity definitions.

For **production deployments**, manual migration scripts should be used instead of relying on JPA auto-updates.

## Migration Files

Migration files in this directory serve as:
1. **Documentation** of schema changes made during refactoring
2. **Production deployment scripts** for controlled database updates
3. **Reference** for understanding the evolution of the database schema

## Migration Naming Convention

```
V{version}__{description}.sql
```

Example: `V001__add_route_stop_fk.sql`

## Future Considerations

For production-grade deployments, consider migrating to:
- **Flyway** - Database migration tool with version control
- **Liquibase** - Alternative database migration framework

This would provide:
- Versioned schema changes
- Automatic rollback support  
- Migration history tracking
- Better control over production deployments

## How to Apply Migrations Manually

When deploying to production:

```bash
# Connect to database
psql -h <host> -U <user> -d <database>

# Run migration file
\i src/main/resources/db/migration/V001__add_route_stop_fk.sql
```

## Current Migrations

| Version | Description | Date | Status |
|---------|-------------|------|--------|
| V001 | Add FK constraints for route start/end stops | 2026-03-07 | Created |

## Notes

- In development, these migrations are informational only
- JPA `ddl-auto: update` handles schema changes automatically
- Before deploying to production, test all migrations in a staging environment
- Always backup the database before running migrations
