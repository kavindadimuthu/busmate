package com.busmate.routeschedule.scheduling.service;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.util.List;

/**
 * Whether a schedule runs on a given date (INC-055). Pure and decoupled from any entity or DTO — every
 * caller maps its own rows into {@link WeeklyPattern} and {@link DatedException} — so search filtering and
 * the passenger details page can share one answer instead of the details page silently defaulting to "yes"
 * (`ScheduleDetails.isActiveOnDate` was declared and never set).
 *
 * <p>A schedule with no calendar recorded at all is neither confirmed to run nor confirmed not to: nobody
 * has said. That is {@link Status#UNKNOWN}, distinct from a calendar that says it does not run that day.
 */
public final class OperatingDayEvaluator {

    private OperatingDayEvaluator() {
    }

    public enum Status {
        RUNS, DOES_NOT_RUN, UNKNOWN
    }

    /** One calendar rule's seven day-of-week flags; several may exist and are unioned (any one saying yes is enough). */
    public record WeeklyPattern(boolean monday, boolean tuesday, boolean wednesday, boolean thursday,
                                 boolean friday, boolean saturday, boolean sunday) {
        boolean runsOn(DayOfWeek day) {
            return switch (day) {
                case MONDAY -> monday;
                case TUESDAY -> tuesday;
                case WEDNESDAY -> wednesday;
                case THURSDAY -> thursday;
                case FRIDAY -> friday;
                case SATURDAY -> saturday;
                case SUNDAY -> sunday;
            };
        }

        /** "Every day", "Except Sunday", "Weekdays", or a plain list — whichever reads most naturally. */
        public String summarise() {
            boolean[] days = {monday, tuesday, wednesday, thursday, friday, saturday, sunday};
            int count = 0;
            for (boolean d : days) {
                if (d) count++;
            }
            if (count == 7) {
                return "Every day";
            }
            if (count == 0) {
                return "No days recorded";
            }
            if (count == 5 && monday && tuesday && wednesday && thursday && friday) {
                return "Weekdays only";
            }
            if (count == 6) {
                String[] names = {"Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"};
                for (int i = 0; i < 7; i++) {
                    if (!days[i]) {
                        return "Except " + names[i];
                    }
                }
            }
            String[] shortNames = {"Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"};
            StringBuilder sb = new StringBuilder();
            for (int i = 0; i < 7; i++) {
                if (days[i]) {
                    if (!sb.isEmpty()) {
                        sb.append(", ");
                    }
                    sb.append(shortNames[i]);
                }
            }
            return sb.toString();
        }
    }

    /** A dated departure from the weekly pattern — an added extra service, or a cancelled one. */
    public record DatedException(LocalDate date, boolean added) {
    }

    /**
     * @param effectiveEnd null for a schedule with no end date (open-ended)
     */
    public static Status evaluate(LocalDate queryDate, LocalDate effectiveStart, LocalDate effectiveEnd,
                                   List<WeeklyPattern> patterns, List<DatedException> exceptions) {
        if (queryDate.isBefore(effectiveStart) || (effectiveEnd != null && queryDate.isAfter(effectiveEnd))) {
            return Status.DOES_NOT_RUN;
        }
        for (DatedException exception : exceptions) {
            if (queryDate.equals(exception.date())) {
                return exception.added() ? Status.RUNS : Status.DOES_NOT_RUN;
            }
        }
        if (patterns == null || patterns.isEmpty()) {
            return Status.UNKNOWN;
        }
        DayOfWeek dayOfWeek = queryDate.getDayOfWeek();
        boolean runs = patterns.stream().anyMatch(p -> p.runsOn(dayOfWeek));
        return runs ? Status.RUNS : Status.DOES_NOT_RUN;
    }
}
