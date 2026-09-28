package com.busmate.routeschedule.postimport;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import com.busmate.routeschedule.postimport.dto.PostReading;
import com.busmate.routeschedule.postimport.dto.ReadDeparture;
import com.busmate.routeschedule.postimport.dto.SkippedLine;
import com.busmate.routeschedule.postimport.service.DepartureCheck;
import com.busmate.routeschedule.postimport.service.PostImportChecks;

@DisplayName("INC-060 grounding and coverage checks (pure, no AI)")
class PostImportChecksTest {

    private final PostImportChecks checks = new PostImportChecks();

    @Test
    @DisplayName("every claimed field found in the quoted source line is grounded")
    void allFieldsGrounded() {
        String line = "6.30am Colombo to Galle - Super Line ABC-1234, semi luxury";
        ReadDeparture d = new ReadDeparture("6.30am", "Colombo", "Galle", "Super Line", List.of("ABC-1234"),
                "semi luxury", null, null, List.of(line));

        List<DepartureCheck> results = checks.checkGrounding(new PostReading(null, List.of(d), List.of()));

        assertThat(results).hasSize(1);
        assertThat(results.get(0).grounded()).isTrue();
        assertThat(results.get(0).ungroundedFields()).isEmpty();
    }

    @Test
    @DisplayName("a field not present in the quoted line is named, not silently accepted")
    void inventedFieldIsUngrounded() {
        String line = "6.30am Colombo to Galle";
        ReadDeparture d = new ReadDeparture("6.30am", "Colombo", "Galle", "Super Line", List.of(),
                null, null, null, List.of(line));

        List<DepartureCheck> results = checks.checkGrounding(new PostReading(null, List.of(d), List.of()));

        assertThat(results.get(0).grounded()).isFalse();
        assertThat(results.get(0).ungroundedFields()).containsExactly("operatorName");
    }

    @Test
    @DisplayName("a plate not present in the quoted line is flagged too")
    void inventedPlateIsUngrounded() {
        String line = "6.30am Colombo to Galle - Super Line";
        ReadDeparture d = new ReadDeparture("6.30am", "Colombo", "Galle", "Super Line", List.of("ZZZ-9999"),
                null, null, null, List.of(line));

        List<DepartureCheck> results = checks.checkGrounding(new PostReading(null, List.of(d), List.of()));

        assertThat(results.get(0).grounded()).isFalse();
        assertThat(results.get(0).ungroundedFields()).containsExactly("plates");
    }

    @Test
    @DisplayName("a timed line read as a departure is accounted for, not flagged unaccounted")
    void readLineIsAccounted() {
        String line = "6.30am Colombo to Galle";
        ReadDeparture d = new ReadDeparture("6.30am", "Colombo", "Galle", null, List.of(),
                null, null, null, List.of(line));

        List<String> unaccounted = checks.checkCoverage(line, new PostReading(null, List.of(d), List.of()));

        assertThat(unaccounted).isEmpty();
    }

    @Test
    @DisplayName("a timed line explicitly skipped is accounted for, not flagged unaccounted")
    void skippedLineIsAccounted() {
        String line = "8.00pm Fares subject to change";

        List<String> unaccounted = checks.checkCoverage(line,
                new PostReading(null, List.of(), List.of(new SkippedLine(line, "a disclaimer"))));

        assertThat(unaccounted).isEmpty();
    }

    @Test
    @DisplayName("a timed line neither read nor skipped is flagged unaccounted")
    void unclaimedTimedLineIsUnaccounted() {
        String read = "6.30am Colombo to Galle";
        String missed = "7.15am Colombo to Matara";
        ReadDeparture d = new ReadDeparture("6.30am", "Colombo", "Galle", null, List.of(),
                null, null, null, List.of(read));

        List<String> unaccounted = checks.checkCoverage(read + "\n" + missed, new PostReading(null, List.of(d), List.of()));

        assertThat(unaccounted).containsExactly(missed);
    }

    @Test
    @DisplayName("a heading with no time on it is never flagged — coverage only cares about timed lines")
    void untimedLineIsIgnored() {
        List<String> unaccounted = checks.checkCoverage("SOUTHERN EXPRESSWAY SECTION",
                new PostReading(null, List.of(), List.of()));

        assertThat(unaccounted).isEmpty();
    }
}
