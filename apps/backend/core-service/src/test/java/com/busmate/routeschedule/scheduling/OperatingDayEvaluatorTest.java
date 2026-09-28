package com.busmate.routeschedule.scheduling;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.LocalDate;
import java.util.List;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import com.busmate.routeschedule.scheduling.service.OperatingDayEvaluator;
import com.busmate.routeschedule.scheduling.service.OperatingDayEvaluator.DatedException;
import com.busmate.routeschedule.scheduling.service.OperatingDayEvaluator.Status;
import com.busmate.routeschedule.scheduling.service.OperatingDayEvaluator.WeeklyPattern;

/**
 * INC-055: whether a schedule runs on a date, computed once and shared by search filtering and the details
 * page (`isActiveOnDate` used to be declared and never set, so passenger-web always read it as "yes").
 */
@DisplayName("INC-055 whether a schedule runs on a date")
class OperatingDayEvaluatorTest {

    private static final LocalDate START = LocalDate.of(2026, 1, 1);
    private static final WeeklyPattern EXCEPT_SUNDAY = new WeeklyPattern(true, true, true, true, true, true, false);
    // 2026-09-28 is a Monday.
    private static final LocalDate MONDAY = LocalDate.of(2026, 9, 28);
    private static final LocalDate SUNDAY = LocalDate.of(2026, 9, 27);

    @Test
    @DisplayName("INC-055 no calendar recorded at all is unknown, not a claim that it runs")
    void inc055_noCalendarIsUnknown() {
        assertThat(OperatingDayEvaluator.evaluate(MONDAY, START, null, List.of(), List.of())).isEqualTo(Status.UNKNOWN);
    }

    @Test
    @DisplayName("INC-055 a recorded calendar is honoured for the day it actually is")
    void inc055_calendarIsHonoured() {
        assertThat(OperatingDayEvaluator.evaluate(MONDAY, START, null, List.of(EXCEPT_SUNDAY), List.of())).isEqualTo(Status.RUNS);
        assertThat(OperatingDayEvaluator.evaluate(SUNDAY, START, null, List.of(EXCEPT_SUNDAY), List.of())).isEqualTo(Status.DOES_NOT_RUN);
    }

    @Test
    @DisplayName("INC-055 an exception overrides the weekly pattern either way")
    void inc055_exceptionOverridesThePattern() {
        assertThat(OperatingDayEvaluator.evaluate(SUNDAY, START, null, List.of(EXCEPT_SUNDAY),
                List.of(new DatedException(SUNDAY, true)))).isEqualTo(Status.RUNS);
        assertThat(OperatingDayEvaluator.evaluate(MONDAY, START, null, List.of(EXCEPT_SUNDAY),
                List.of(new DatedException(MONDAY, false)))).isEqualTo(Status.DOES_NOT_RUN);
    }

    @Test
    @DisplayName("INC-055 outside the schedule's validity period it does not run, calendar or not")
    void inc055_outsideValidityPeriodNeverRuns() {
        assertThat(OperatingDayEvaluator.evaluate(START.minusDays(1), START, null, List.of(), List.of())).isEqualTo(Status.DOES_NOT_RUN);
        LocalDate end = START.plusDays(10);
        assertThat(OperatingDayEvaluator.evaluate(end.plusDays(1), START, end, List.of(EXCEPT_SUNDAY), List.of())).isEqualTo(Status.DOES_NOT_RUN);
    }

    @Test
    @DisplayName("INC-055 several calendar rows are unioned: any one saying yes is enough")
    void inc055_multiplePatternsAreUnioned() {
        WeeklyPattern sundaysOnly = new WeeklyPattern(false, false, false, false, false, false, true);
        assertThat(OperatingDayEvaluator.evaluate(SUNDAY, START, null, List.of(EXCEPT_SUNDAY, sundaysOnly), List.of())).isEqualTo(Status.RUNS);
    }

    @Test
    @DisplayName("INC-055 the summary reads naturally for the common shapes")
    void inc055_summaryReadsNaturally() {
        assertThat(new WeeklyPattern(true, true, true, true, true, true, true).summarise()).isEqualTo("Every day");
        assertThat(EXCEPT_SUNDAY.summarise()).isEqualTo("Except Sunday");
        assertThat(new WeeklyPattern(true, true, true, true, true, false, false).summarise()).isEqualTo("Weekdays only");
        assertThat(new WeeklyPattern(true, false, true, false, false, false, false).summarise()).isEqualTo("Mon, Wed");
        assertThat(new WeeklyPattern(false, false, false, false, false, false, false).summarise()).isEqualTo("No days recorded");
    }
}
