package com.busmatelk.backend.repository;


import com.busmatelk.backend.model.Passenger;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@EnableJpaRepositories
@Repository
public interface PassengerRepo extends JpaRepository<Passenger, UUID> {

    Optional<Passenger> findByUserUserId(UUID userId);
}
