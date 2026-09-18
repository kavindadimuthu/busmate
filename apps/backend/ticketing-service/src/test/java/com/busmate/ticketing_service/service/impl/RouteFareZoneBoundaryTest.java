package com.busmate.ticketing_service.service.impl;

import com.busmate.ticketing_service.AbstractPostgresIntegrationTest;
import com.busmate.ticketing_service.entity.BaseFare;
import com.busmate.ticketing_service.entity.RouteFare;
import com.busmate.ticketing_service.exception.BadRequestException;
import com.busmate.ticketing_service.fare.ServiceClass;
import com.busmate.ticketing_service.repository.BaseFareRepo;
import com.busmate.ticketing_service.repository.RouteFareRepo;
import com.busmate.ticketing_service.service.RouteFareService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * A real bug found while live-testing INC-013's booking UI, not by inspection: booking a journey
 * from a route's own origin stop refused with "no published fare section covering the boarding
 * stop", even though the route's fare data was actually complete.
 *
 * <p>Each {@code route_fare_section} row records where a fare zone ENDS, not where it starts -
 * mirrors the real Colombo-Kandy data exactly: "Colombo Fort - Kadawatha" is stored at distance
 * 12 (Kadawatha), covering the whole 0-12km zone including Colombo Fort itself at 0km. Boarding
 * at 0km must resolve to that same zone (the nearest boundary at or beyond the boarding distance)
 * - not "no zone found", which is what searching for a boundary below the distance produced,
 * since there is none below the route's own origin.
 *
 * <p>Never caught earlier because every previously-tested journey happened to board at a stop
 * that was itself an exact section boundary (Kadawatha), never at the route's true origin.
 */
@SpringBootTest
class RouteFareZoneBoundaryTest extends AbstractPostgresIntegrationTest {

    private static final String ROUTE_ID = "route-fare-zone-boundary-test";

    @Autowired
    private RouteFareService routeFareService;
    @Autowired
    private BaseFareRepo baseFareRepo;
    @Autowired
    private RouteFareRepo routeFareRepo;

    @BeforeEach
    void setUp() {
        baseFareRepo.deleteAll();
        routeFareRepo.deleteAll();

        // The real Colombo-Kandy fare table and zone boundaries (base_fare, INC-011 seed data).
        baseFareRepo.save(new BaseFare(1, 15.0, 20.0, 25.0, 35.0, null));
        baseFareRepo.save(new BaseFare(2, 35.0, 45.0, 55.0, 70.0, 90.0));
        routeFareRepo.save(new RouteFare(null, ROUTE_ID, 1, "Colombo Fort - Kadawatha", 12.0));
        routeFareRepo.save(new RouteFare(null, ROUTE_ID, 2, "Kadawatha - Kegalle", 78.0));
        routeFareRepo.save(new RouteFare(null, ROUTE_ID, 3, "Kegalle - Kandy", 115.0));
    }

    @Test
    @DisplayName("boarding at a route's own origin (0km, below every recorded zone boundary) prices correctly")
    void boardingAtRouteOriginResolvesToTheFirstZone() {
        // Colombo Fort (0km, the route's own origin - not an exact zone-boundary match) to
        // Kandy (115km, an exact match). Real numbers, real bug.
        BigDecimal fare = routeFareService.priceJourney(ROUTE_ID, 0.0, 115.0, ServiceClass.SEMI_LUXURY);

        assertThat(fare).isEqualByComparingTo("45.00");
    }

    @Test
    @DisplayName("boarding mid-zone (not at a boundary) still resolves to that zone")
    void boardingMidZoneResolvesToTheEnclosingZone() {
        // 5km is inside the first zone (0-12km) without matching either end of it.
        BigDecimal fare = routeFareService.priceJourney(ROUTE_ID, 5.0, 115.0, ServiceClass.SEMI_LUXURY);

        assertThat(fare).isEqualByComparingTo("45.00");
    }

    @Test
    @DisplayName("boarding past every recorded zone boundary is still refused, not silently priced")
    void boardingPastEveryZoneIsRefused() {
        assertThatThrownBy(() -> routeFareService.priceJourney(ROUTE_ID, 200.0, 210.0, ServiceClass.NORMAL))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("boarding stop");
    }
}
