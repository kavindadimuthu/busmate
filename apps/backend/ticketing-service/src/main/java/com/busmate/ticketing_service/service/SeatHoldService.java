package com.busmate.ticketing_service.service;

/**
 * Frees a seat held by an abandoned, unpaid online booking (INC-012).
 *
 * <p>Every method here commits independently of whatever transaction called it
 * ({@code REQUIRES_NEW}) - on purpose. A seat that was genuinely freed must stay freed even when
 * the caller goes on to refuse the request it was checking (a stale hold discovered while trying
 * to pay for it, say): the ticket really did lose its seat, and that fact must survive the
 * caller's own transaction rolling back.
 */
public interface SeatHoldService {

    /**
     * Cancels the ticket and fails its payment if it is a stale, unpaid online hold.
     *
     * @return true if it was stale and has just been expired; false if it is still an active
     *         hold, already paid, already cancelled, or not an online booking at all
     */
    boolean expireIfStale(Long ticketId);

    /** Sweeps every stale hold in the system, independent of anyone booking against one (INC-012). */
    void expireAllStaleHolds();
}
