package com.busmate.routeschedule.shared;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import com.busmate.routeschedule.shared.enums.TimeSourceEnum;
import com.busmate.routeschedule.shared.provenance.SourceTier;
import com.busmate.routeschedule.shared.provenance.TrustLabel;
import com.busmate.routeschedule.shared.provenance.TrustLabels;

@DisplayName("INC-028 trust labels")
class TrustLabelsTest {

    @Test
    @DisplayName("INC-028 an authoritative time inherits its record's source")
    void inc028_authoritativeTimeInheritsRecordSource() {
        assertThat(TrustLabels.forTime(TimeSourceEnum.VERIFIED, SourceTier.SRC_1)).isEqualTo(TrustLabel.OFFICIAL);
        assertThat(TrustLabels.forTime(TimeSourceEnum.VERIFIED, SourceTier.SRC_2)).isEqualTo(TrustLabel.OPERATOR_TIMETABLE);
        assertThat(TrustLabels.forTime(TimeSourceEnum.VERIFIED, SourceTier.SRC_3)).isEqualTo(TrustLabel.OPERATOR_TIMETABLE);
        assertThat(TrustLabels.forTime(TimeSourceEnum.VERIFIED, SourceTier.SRC_4)).isEqualTo(TrustLabel.OBSERVED);
        assertThat(TrustLabels.forTime(TimeSourceEnum.VERIFIED, SourceTier.SRC_5)).isEqualTo(TrustLabel.REPORTED);
        assertThat(TrustLabels.forTime(TimeSourceEnum.VERIFIED, SourceTier.SRC_6)).isEqualTo(TrustLabel.ESTIMATED);
    }

    @Test
    @DisplayName("INC-028 an unverified time is always a report and a calculated time always an estimate, whatever the record's source")
    void inc028_columnDecidesForUnverifiedAndCalculated() {
        for (SourceTier tier : SourceTier.values()) {
            assertThat(TrustLabels.forTime(TimeSourceEnum.UNVERIFIED, tier)).isEqualTo(TrustLabel.REPORTED);
            assertThat(TrustLabels.forTime(TimeSourceEnum.CALCULATED, tier)).isEqualTo(TrustLabel.ESTIMATED);
        }
    }

    @Test
    @DisplayName("INC-028 no time from a schedule is ever labelled live, and no time means no label")
    void inc028_scheduleTimesAreNeverLive() {
        for (TimeSourceEnum source : TimeSourceEnum.values()) {
            for (SourceTier tier : SourceTier.values()) {
                assertThat(TrustLabels.forTime(source, tier)).isNotEqualTo(TrustLabel.LIVE);
            }
        }
        assertThat(TrustLabels.forTime(TimeSourceEnum.UNAVAILABLE, SourceTier.SRC_1)).isNull();
        assertThat(TrustLabels.forTime(null, SourceTier.SRC_1)).isNull();
    }

    @Test
    @DisplayName("INC-028 a record with no recorded source is never labelled better than observed")
    void inc028_missingSourceNeverClaimsMore() {
        assertThat(TrustLabels.forRecord(null)).isEqualTo(TrustLabel.OBSERVED);
    }

    @Test
    @DisplayName("INC-028 only a vehicle position is labelled live, with the time of the fix")
    void inc028_liveComesFromAFix() {
        java.time.Instant fix = java.time.Instant.parse("2026-09-19T10:00:00Z");
        assertThat(TrustLabels.live(fix).getLabel()).isEqualTo(TrustLabel.LIVE);
        assertThat(TrustLabels.live(fix).getObservedAt()).isEqualTo(fix);
    }
}
