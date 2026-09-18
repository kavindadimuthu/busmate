package com.busmate.ticketing_service.service;

import com.busmate.ticketing_service.dto.BaseFareDTO;
import com.busmate.ticketing_service.fare.ServiceClass;

import java.math.BigDecimal;

public interface BaseFareService {
     void saveSection(BaseFareDTO baseFareDTO);

    String getBaseFareBySection(String section , String type);

    /**
     * The fare for a section span at a service class, as a number (INC-011). The String-returning
     * method above answers failures with prose in its success channel, which a caller cannot
     * distinguish from a price; this one throws instead, so a booking can never be priced by
     * parsing an error message.
     */
    BigDecimal fareFor(int sectionDifference, ServiceClass serviceClass);



}
