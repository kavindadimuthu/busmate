package com.busmatelk.backend.repository;

import com.busmatelk.backend.model.FinanceOfficer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@EnableJpaRepositories
@Repository
public interface FinanceOfficerRepo extends JpaRepository<FinanceOfficer, UUID> {
}
