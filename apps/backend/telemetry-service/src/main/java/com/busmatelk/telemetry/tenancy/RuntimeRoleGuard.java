package com.busmatelk.telemetry.tenancy;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.SmartInitializingSingleton;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

/**
 * Refuses to start when the database role this service serves requests as could bypass row-level
 * security (INC-024, ADR-016). A superuser and a {@code BYPASSRLS} role skip every policy, and the
 * owner of a table is not bound by policies that are not forced on it; running as any of those would
 * leave isolation looking enforced while enforcing nothing. Failing loudly at startup is the point:
 * a deploy that falls back to the owner or superuser must not run unprotected.
 *
 * <p>Runs after every singleton exists, so migrations have already run and the tables can be checked.
 */
@Component
@Slf4j
public class RuntimeRoleGuard implements SmartInitializingSingleton {

    /** Tables whose rows are tenant-scoped; the runtime role must own none of them. */
    static final List<String> PROTECTED_TABLES = List.of("bus_vehicle_state", "bus_active_alert");

    private final JdbcTemplate jdbcTemplate;

    public RuntimeRoleGuard(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void afterSingletonsInstantiated() {
        String role = jdbcTemplate.queryForObject("select current_user", String.class);
        Boolean superuser = jdbcTemplate.queryForObject("select rolsuper from pg_roles where rolname = current_user", Boolean.class);
        Boolean bypassRls = jdbcTemplate.queryForObject("select rolbypassrls from pg_roles where rolname = current_user", Boolean.class);
        Long ownedTables = jdbcTemplate.queryForObject(
                "select count(*) from pg_class c join pg_roles r on r.oid = c.relowner "
                        + "where r.rolname = current_user and c.relname = any (?)",
                Long.class, (Object) PROTECTED_TABLES.toArray(new String[0]));

        List<String> problems = problems(Boolean.TRUE.equals(superuser), Boolean.TRUE.equals(bypassRls), ownedTables == null ? 0 : ownedTables);
        if (!problems.isEmpty()) {
            throw new IllegalStateException(("telemetry-service is connected to the database as '%s', which %s. "
                    + "Row-level security would not protect operators' data. Connect as the restricted runtime role "
                    + "(see scripts/postgres/provision-telemetry-app-role.sql) and keep the owner role for migrations only "
                    + "(spring.flyway.user).").formatted(role, String.join(" and ", problems)));
        }
        log.info("Database role '{}' is restricted (not a superuser, no BYPASSRLS, owns no protected tables)", role);
    }

    /** What is wrong with a role that has these attributes; empty means it is safe to serve requests as. */
    static List<String> problems(boolean superuser, boolean bypassRls, long ownedProtectedTables) {
        List<String> problems = new ArrayList<>();
        if (superuser) problems.add("is a superuser");
        if (bypassRls) problems.add("has BYPASSRLS");
        if (ownedProtectedTables > 0) problems.add("owns the vehicle tables");
        return problems;
    }
}
