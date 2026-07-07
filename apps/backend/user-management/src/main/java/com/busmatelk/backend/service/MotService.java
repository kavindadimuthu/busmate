package com.busmatelk.backend.service;

import com.busmatelk.backend.dto.MotDTO;

public interface MotService {

    void createMotUser(MotDTO motDTO);

    MotDTO getMotById(String userId);

    MotDTO updateMotUser(String userId, String fullName, String phoneNumber);
}
