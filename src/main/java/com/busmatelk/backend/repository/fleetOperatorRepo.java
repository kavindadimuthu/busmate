package com.busmatelk.backend.repository;

import com.busmatelk.backend.model.User;
import com.busmatelk.backend.model.fleetOperatorModel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@EnableJpaRepositories
@Repository
public interface fleetOperatorRepo extends JpaRepository<fleetOperatorModel, UUID> {
    Optional<fleetOperatorModel> findByUser(User user);
}
