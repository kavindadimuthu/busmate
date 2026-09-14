package com.busmate.ticketing_service.sales;

import java.util.Arrays;
import java.util.Optional;

/**
 * Who sold a ticket, and — the part screens group by — at what stage of the journey it was sold
 * (INC-010, ADR-012).
 *
 * Channel codes are deliberately the stored {@code Tickets.IssueMethod} values, so there is no
 * mapping layer between what is persisted and what is reported.
 *
 * <h2>Adding a sale channel (depot counter, agent, …)</h2>
 * <ol>
 *   <li>Add a constant here with its {@link SaleStage}. A counter or agent sale made before
 *       departure is {@code PRE_BOOKED}. Every ticket screen groups by stage, so nothing else in
 *       the reporting path changes.</li>
 *   <li>Add the value to {@code Tickets.IssueMethod} and widen {@code tickets_issue_method_check}
 *       in a new Flyway migration — deliberate, human-reviewed friction, same reasoning as
 *       payment methods in ADR-011.</li>
 *   <li>Build the issuing flow itself.</li>
 * </ol>
 *
 * <h2>Adding a sale stage</h2>
 * Rare and a genuine product change, so it needs a new ADR rather than just a constant: every
 * stage has its own boarding lifecycle, and screens present stages, not channels.
 */
public enum SaleChannel {

    /** Sold by the conductor during the trip. The passenger is on board at the moment of sale. */
    CONDUCTOR(SaleStage.ON_BUS),

    /** Bought by the passenger before boarding, through the passenger app or web. */
    ONLINE(SaleStage.PRE_BOOKED);

    /**
     * When the ticket was sold relative to boarding. Closed on purpose: the two stages behave
     * differently — an on-bus ticket is boarded when sold, a pre-booked one waits to be boarded
     * or cancelled — and that difference is why screens group by stage. UNKNOWN keeps a ticket
     * with an unrecognised channel visible instead of dropping it.
     */
    public enum SaleStage { ON_BUS, PRE_BOOKED, UNKNOWN }

    private final SaleStage stage;

    SaleChannel(SaleStage stage) {
        this.stage = stage;
    }

    public SaleStage getStage() {
        return stage;
    }

    /** Empty for a channel code this build does not know. */
    public static Optional<SaleChannel> resolve(String code) {
        if (code == null) {
            return Optional.empty();
        }
        return Arrays.stream(values())
                .filter(channel -> channel.name().equalsIgnoreCase(code))
                .findFirst();
    }

    /** Never throws: an unrecognised channel is reported UNKNOWN, not hidden. */
    public static SaleStage stageOf(String code) {
        return resolve(code).map(SaleChannel::getStage).orElse(SaleStage.UNKNOWN);
    }
}
