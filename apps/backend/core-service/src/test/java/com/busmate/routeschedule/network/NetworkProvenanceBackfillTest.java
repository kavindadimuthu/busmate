package com.busmate.routeschedule.network;

import static org.assertj.core.api.Assertions.assertThat;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.Statement;

import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import com.busmate.routeschedule.AbstractPostgresIntegrationTest;

/**
 * Runs the migrations up to V006, stores rows the way the system did before provenance existed,
 * then applies V007 — the only honest way to test a backfill, since the application context has
 * already migrated everything by the time a normal test runs.
 */
@DisplayName("INC-027 backfill of existing network records")
class NetworkProvenanceBackfillTest extends AbstractPostgresIntegrationTest {

    @Test
    @DisplayName("INC-027 existing rows become observed SRC_4 credited to BusMate, never official")
    void inc027_existingRowsAreLabelledObservedNeverOfficial() throws Exception {
        String adminUrl = POSTGRES.getJdbcUrl();
        String dbUrl = adminUrl.substring(0, adminUrl.lastIndexOf('/') + 1) + "inc027_backfill";
        try (Connection admin = DriverManager.getConnection(adminUrl, POSTGRES.getUsername(), POSTGRES.getPassword());
             Statement st = admin.createStatement()) {
            st.execute("DROP DATABASE IF EXISTS inc027_backfill");
            st.execute("CREATE DATABASE inc027_backfill");
        }

        Flyway.configure().dataSource(dbUrl, POSTGRES.getUsername(), POSTGRES.getPassword())
                .locations("classpath:db/migration").target("6").load().migrate();

        try (Connection c = DriverManager.getConnection(dbUrl, POSTGRES.getUsername(), POSTGRES.getPassword());
             Statement st = c.createStatement()) {
            st.execute("INSERT INTO public.stop (id, name, created_at, updated_at) VALUES "
                    + "('11111111-1111-1111-1111-111111111111', 'Old Stop', '2019-05-01 08:00', '2020-01-15 10:30')");
            st.execute("INSERT INTO public.route_group (id, name, created_at) VALUES "
                    + "('22222222-2222-2222-2222-222222222222', 'Old Group', '2018-03-04 09:00')");

            Flyway.configure().dataSource(dbUrl, POSTGRES.getUsername(), POSTGRES.getPassword())
                    .locations("classpath:db/migration").load().migrate();

            try (ResultSet rs = st.executeQuery("SELECT source_tier, attribution_label, base_confidence, "
                    + "attributed_user_id, observed_at::date AS d FROM public.stop")) {
                assertThat(rs.next()).isTrue();
                assertThat(rs.getString("source_tier")).isEqualTo("SRC_4");
                assertThat(rs.getString("attribution_label")).isEqualTo("BusMate");
                assertThat(rs.getInt("base_confidence")).isEqualTo(50);
                assertThat(rs.getObject("attributed_user_id")).isNull();
                assertThat(rs.getString("d")).isEqualTo("2020-01-15"); // updated_at wins over created_at
            }
            try (ResultSet rs = st.executeQuery("SELECT source_tier, observed_at::date AS d FROM public.route_group")) {
                assertThat(rs.next()).isTrue();
                assertThat(rs.getString("source_tier")).isEqualTo("SRC_4");
                assertThat(rs.getString("d")).isEqualTo("2018-03-04"); // no updated_at: created_at
            }
            try (ResultSet rs = st.executeQuery("SELECT count(*) FROM public.stop WHERE source_tier = 'SRC_1'")) {
                rs.next();
                assertThat(rs.getInt(1)).isZero();
            }
        }
    }
}
