package com.busmate.ticketing_service.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/** Whether online booking is open (INC-072). One fact, safe to show anyone, so a client can say so before a passenger picks seats. */
@Data
@AllArgsConstructor
@NoArgsConstructor
public class BookingStatusDTO {
    private boolean onlineBookingOpen;
}
