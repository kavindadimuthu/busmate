package com.busmatelk.backend.service;

import com.busmatelk.backend.dto.fleetOperatorDTO;
import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;

public interface fleetOperatorProfileService {

void addfleetOperatorProfile( fleetOperatorDTO fleetOperatorDTO);

    fleetOperatorDTO getFleetoperatorById(UUID userId);

    void updateFleetOperatorProfile(UUID userId, fleetOperatorDTO fleetOperatorDTO, MultipartFile file);

    void deleteFleetOperator(UUID userId);
}
