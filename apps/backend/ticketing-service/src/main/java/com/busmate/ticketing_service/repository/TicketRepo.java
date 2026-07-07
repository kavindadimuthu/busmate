package com.busmate.ticketing_service.repository;

import com.busmate.ticketing_service.entity.Tickets;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TicketRepo extends JpaRepository<Tickets, Long> {
    List<Tickets> findByConductorId(String conductorId);

    List<Tickets> findByBusId(String busId);

    List<Tickets> findByTripId(String tripId);

    List<Tickets> findByPassengerId(String passengerId);
}
