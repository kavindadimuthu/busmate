package com.busmate.ticketing_service.dto.request;

import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

/**
 * A passenger's request to book seats on a trip. Always paid online, unlike the conductor-issue
 * flow which also takes cash.
 *
 * <p>Since INC-011 this says what the passenger wants, not what it costs or who they are: the
 * fare is computed server-side from core-service's facts, and the passenger is taken from the
 * verified token. {@code passengerId} and {@code fareAmount} are retained only so existing
 * generated clients keep compiling — both are ignored.
 */
@Data
public class BookingRequestDTO {

    /** @deprecated Ignored since INC-011 - the booking belongs to the signed-in caller. */
    @Deprecated
    private String passengerId;

    private String busId;
    private String tripId;
    private String startLocationId;
    private String endLocationId;

    /** @deprecated Ignored since INC-011 - the server prices the journey itself. */
    @Deprecated
    private BigDecimal fareAmount;

    /** Single-seat form, kept for existing clients. Ignored when {@link #seatNumbers} is given. */
    private String seatNumber;

    /** One ticket is issued per seat, all against one payment. */
    private List<String> seatNumbers;
}
