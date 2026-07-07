package com.busmate.ticketing_service.service;

import com.busmate.ticketing_service.dto.BaseFareDTO;

public interface BaseFareService {
     void saveSection(BaseFareDTO baseFareDTO);

    String getBaseFareBySection(String section , String type);



}
