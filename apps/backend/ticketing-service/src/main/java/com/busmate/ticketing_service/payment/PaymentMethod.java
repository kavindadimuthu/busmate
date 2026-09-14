package com.busmate.ticketing_service.payment;

import java.util.Arrays;
import java.util.Optional;

/**
 * The catalogue of ways a fare can be paid, and — the part that matters for reporting — who ends
 * up holding the money (INC-009, ADR-011).
 *
 * <h2>Adding a payment method (wallets, LankaQR, …)</h2>
 * <ol>
 *   <li>Add a constant here with its {@link Custody}. That is the only classification step;
 *       every revenue breakdown groups by custody, so the new method flows through to all of
 *       them with no further backend change.</li>
 *   <li>Add the matching value to {@code Online.Method} and widen the {@code online_method_check}
 *       constraint in a new Flyway migration. That migration is deliberate friction on a money
 *       ledger, not an oversight — it is what stops a typo'd method code entering the fare
 *       record, and it gets human review under HACO because adding a payment method is a
 *       commercial decision, not a refactor.</li>
 *   <li>Optionally give the code an icon/label in conductor-mobile's payment-method presentation
 *       map. Skipping this is safe: unknown codes render with neutral styling and the raw code,
 *       never disappearing from a total.</li>
 * </ol>
 *
 * Nothing else — no UI screen, no summary endpoint, no chart — needs to change.
 */
public enum PaymentMethod {

    /** Physical cash handed to the conductor. */
    CASH(Custody.ON_HAND),

    /** Card tapped/entered on the bus through the conductor's app (INC-008). */
    CARD(Custody.SETTLED),

    /** Passenger's own online booking, paid on PayHere's hosted checkout. */
    PAYHERE(Custody.SETTLED);

    /**
     * Who physically holds the money once the fare is paid. This is the axis every revenue
     * breakdown groups by, and unlike the list of payment methods it is not expected to grow:
     * money is either in the conductor's pocket or it settled to the operator's account.
     * UNKNOWN exists so unclassifiable money is reported as unclassified rather than silently
     * dropped from a total.
     */
    public enum Custody { ON_HAND, SETTLED, UNKNOWN }

    private final Custody custody;

    PaymentMethod(Custody custody) {
        this.custody = custody;
    }

    public Custody getCustody() {
        return custody;
    }

    /** Empty for a code this build does not know — a method added to the data ahead of the code. */
    public static Optional<PaymentMethod> resolve(String code) {
        if (code == null) {
            return Optional.empty();
        }
        return Arrays.stream(values())
                .filter(method -> method.name().equalsIgnoreCase(code))
                .findFirst();
    }

    /** Never throws for an unrecognised code: unknown money stays visible, just unclassified. */
    public static Custody custodyOf(String code) {
        return resolve(code).map(PaymentMethod::getCustody).orElse(Custody.UNKNOWN);
    }
}
