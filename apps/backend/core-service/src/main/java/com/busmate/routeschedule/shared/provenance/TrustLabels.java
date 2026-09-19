package com.busmate.routeschedule.shared.provenance;

import java.time.Instant;

import com.busmate.routeschedule.shared.enums.TimeSourceEnum;

/**
 * The single place a record's source and a displayed value's time column become the label a passenger
 * sees, so every passenger surface agrees. A time is only as trustworthy as the column it was read from:
 * the authoritative column inherits its record's tier, the unverified column is always a report, and the
 * calculated column is always an estimate.
 */
public final class TrustLabels {

    private TrustLabels() {
    }

    /** The label for a value read from the authoritative column of a record with this source. */
    public static TrustLabel forRecord(SourceTier tier) {
        if (tier == null) {
            return TrustLabel.OBSERVED; // rows always carry a tier; if one ever did not, never claim more
        }
        return switch (tier) {
            case SRC_1 -> TrustLabel.OFFICIAL;
            case SRC_2, SRC_3 -> TrustLabel.OPERATOR_TIMETABLE;
            case SRC_4 -> TrustLabel.OBSERVED;
            case SRC_5 -> TrustLabel.REPORTED;
            case SRC_6 -> TrustLabel.ESTIMATED;
        };
    }

    /** The label for a resolved time; null when there is no time to label. */
    public static TrustLabel forTime(TimeSourceEnum source, SourceTier recordTier) {
        if (source == null) {
            return null;
        }
        return switch (source) {
            case VERIFIED -> forRecord(recordTier);
            case UNVERIFIED -> TrustLabel.REPORTED;
            case CALCULATED -> TrustLabel.ESTIMATED;
            case UNAVAILABLE -> null;
        };
    }

    public static TrustInfo timeTrust(TimeSourceEnum source, SourceTier recordTier, Instant recordObservedAt) {
        return TrustInfo.of(forTime(source, recordTier), recordObservedAt);
    }

    public static TrustInfo timeTrust(TimeSourceEnum source, Provenance recordProvenance) {
        return recordProvenance == null
                ? timeTrust(source, null, null)
                : timeTrust(source, recordProvenance.getSourceTier(), recordProvenance.getObservedAt());
    }

    public static TrustInfo recordTrust(SourceTier tier, Instant observedAt) {
        return TrustInfo.of(forRecord(tier), observedAt);
    }

    public static TrustInfo recordTrust(Provenance recordProvenance) {
        return recordProvenance == null
                ? null
                : recordTrust(recordProvenance.getSourceTier(), recordProvenance.getObservedAt());
    }

    public static TrustInfo live(Instant fixIngestedAt) {
        return TrustInfo.of(TrustLabel.LIVE, fixIngestedAt);
    }
}
