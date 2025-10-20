package com.busmatelk.backend.repository;

import com.busmatelk.backend.model.Timekeeper;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@EnableJpaRepositories
@Repository
public interface TimekeeperRepo extends JpaRepository<Timekeeper, UUID> {
    Optional<Timekeeper> findByUserUserId(UUID userId);
}
