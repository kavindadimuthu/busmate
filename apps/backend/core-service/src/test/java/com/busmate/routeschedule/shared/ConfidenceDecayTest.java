package com.busmate.routeschedule.shared;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Duration;
import java.time.Instant;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import com.busmate.routeschedule.shared.provenance.ConfidenceDecay;
import com.busmate.routeschedule.shared.provenance.Provenance;
import com.busmate.routeschedule.shared.provenance.SourceTier;

/** ADR-018: "confidence decays at read time" — no job rewrites rows, so this is what a read computes. */
@DisplayName("INC-054 confidence decay")
class ConfidenceDecayTest {

    @Test
    @DisplayName("INC-054 just observed, confidence is exactly the base value")
    void inc054_freshRecordIsNotDecayed() {
        Instant now = Instant.now();
        assertThat(ConfidenceDecay.effectiveConfidence(SourceTier.SRC_4, 50, now, now)).isEqualTo(50);
        assertThat(ConfidenceDecay.effectiveConfidence(SourceTier.SRC_4, 50, now, now.minusSeconds(60))).isEqualTo(50);
    }

    @Test
    @DisplayName("INC-054 at exactly its half-life, half the distance to the floor is gone")
    void inc054_halfLifeHalvesTheDistanceToTheFloor() {
        Instant observed = Instant.now();
        Instant now = observed.plus(Duration.ofDays(SourceTier.SRC_5.confidenceHalfLifeDays()));
        // base 30, floor 10: distance 20, half gone leaves 10 + 10 = 20
        assertThat(ConfidenceDecay.effectiveConfidence(SourceTier.SRC_5, 30, observed, now)).isEqualTo(20);
    }

    @Test
    @DisplayName("INC-054 it never falls below the floor, however old")
    void inc054_neverBelowTheFloor() {
        Instant observed = Instant.now().minus(Duration.ofDays(365 * 20));
        assertThat(ConfidenceDecay.effectiveConfidence(SourceTier.SRC_5, 30, observed, Instant.now())).isGreaterThanOrEqualTo(10);
    }

    @Test
    @DisplayName("INC-054 official data decays far slower than a passenger report of the same age")
    void inc054_officialDataOutlastsAReport() {
        Instant observed = Instant.now().minus(Duration.ofDays(60));
        int official = ConfidenceDecay.effectiveConfidence(SourceTier.SRC_1, 90, observed, Instant.now());
        int reported = ConfidenceDecay.effectiveConfidence(SourceTier.SRC_5, 30, observed, Instant.now());
        assertThat(official).isGreaterThan(80); // barely moved in 60 days
        assertThat(reported).isCloseTo(20, org.assertj.core.data.Offset.offset(2)); // one half-life in: halfway to the floor
    }

    @Test
    @DisplayName("INC-054 missing inputs are refused decay, not a guess: the base value stands")
    void inc054_missingInputsKeepTheBaseValue() {
        assertThat(ConfidenceDecay.effectiveConfidence(null, 50, Instant.now(), Instant.now())).isEqualTo(50);
        assertThat(ConfidenceDecay.effectiveConfidence(SourceTier.SRC_4, null, Instant.now(), Instant.now())).isNull();
        assertThat(ConfidenceDecay.effectiveConfidence(SourceTier.SRC_4, 50, null, Instant.now())).isEqualTo(50);
    }

    @Test
    @DisplayName("INC-054 a record's own effective-confidence getter agrees with the pure function")
    void inc054_provenanceGetterMatchesTheFunction() {
        Provenance p = Provenance.of(SourceTier.SRC_5, "A post", null, Instant.now().minus(Duration.ofDays(30)));
        assertThat(p.getEffectiveConfidence())
                .isEqualTo(ConfidenceDecay.effectiveConfidence(SourceTier.SRC_5, p.getBaseConfidence(), p.getObservedAt(), Instant.now()));
    }
}
