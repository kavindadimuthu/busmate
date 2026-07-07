package com.busmate.ticketing_service.repository;

import com.busmate.ticketing_service.entity.Cash;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ConductorLogRepo extends JpaRepository<Cash, Integer> {
}
