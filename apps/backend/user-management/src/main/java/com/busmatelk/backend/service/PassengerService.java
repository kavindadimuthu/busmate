package com.busmatelk.backend.service;

import com.busmatelk.backend.dto.PassengerDTO;
import com.busmatelk.backend.dto.request.PassengerUpdateDTO;

import java.util.List;
import java.util.UUID;

public interface PassengerService {


    void createPassenger(PassengerDTO passengerDTO);


    PassengerDTO getPassengerById(UUID userId);

    PassengerDTO updatePassenger(UUID userId, PassengerUpdateDTO updateDTO);

    List<PassengerDTO> getAllPassengers();
}
