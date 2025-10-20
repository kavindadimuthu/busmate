package com.busmatelk.backend.repository;

import com.busmatelk.backend.model.Conductor;
import com.busmatelk.backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@EnableJpaRepositories
@Repository
public interface ConductorRepo extends JpaRepository<Conductor, UUID> {
    Optional<Conductor> findByUser(User user);
}
